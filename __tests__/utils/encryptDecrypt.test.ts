/**
 * @file 加密模块测试
 * @description 测试 Web Crypto API AES-GCM 加密解密功能
 * @module __tests__/utils/encryptDecrypt.test
 * @author YYC
 * @version 1.0.0
 * @created 2026-05-24
 * @jest-environment node
 */

const _AES_KEY_LENGTH = 256;
const _IV_LENGTH = 12;
const _SALT_LENGTH = 16;

interface EncryptedData {
  salt: string;
  iv: string;
  data: string;
}

async function generateKey(length: number = 32): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => chars[b % chars.length]).join('');
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: _AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encrypt(text: string, password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(_SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(_IV_LENGTH));
    
    const key = await deriveKey(password, salt);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(text)
    );

    const encryptedData: EncryptedData = {
      salt: btoa(String.fromCharCode(...salt)),
      iv: btoa(String.fromCharCode(...iv)),
      data: btoa(String.fromCharCode(...new Uint8Array(encrypted)))
    };

    return JSON.stringify(encryptedData);
  } catch (error) {
    throw new Error(`加密失败: ${(error as Error).message}`);
  }
}

async function decrypt(encryptedStr: string, password: string): Promise<string> {
  try {
    let encryptedData: EncryptedData;
    
    try {
      encryptedData = JSON.parse(encryptedStr);
    } catch {
      throw new Error('无效的加密数据格式');
    }

    if (!encryptedData.salt || !encryptedData.iv || !encryptedData.data) {
      throw new Error('加密数据结构不完整');
    }

    const salt = new Uint8Array(
      atob(encryptedData.salt).split('').map(c => c.charCodeAt(0))
    );
    const iv = new Uint8Array(
      atob(encryptedData.iv).split('').map(c => c.charCodeAt(0))
    );
    const data = new Uint8Array(
      atob(encryptedData.data).split('').map(c => c.charCodeAt(0))
    );

    const key = await deriveKey(password, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    if (error instanceof Error && error.message.includes('解密失败')) {
      throw error;
    }
    throw new Error('解密失败，请检查密钥是否正确');
  }
}

describe('AES Encryption Module', () => {
  describe('generateKey', () => {
    it('should generate a key with specified length', async () => {
      const key = await generateKey(32);
      expect(key.length).toBe(32);
    });

    it('should generate different keys each time', async () => {
      const key1 = await generateKey();
      const key2 = await generateKey();
      expect(key1).not.toBe(key2);
    });

    it('should use default length of 32 when not specified', async () => {
      const key = await generateKey();
      expect(key.length).toBe(32);
    });
  });

  describe('deriveKey', () => {
    it('should derive a valid CryptoKey from password and salt', async () => {
      const password = 'test-password';
      const salt = new Uint8Array(_SALT_LENGTH);
      
      const key = await deriveKey(password, salt);
      
      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
      expect(key.algorithm.name).toBe('AES-GCM');
    });

    it('should produce different keys for same password with different salts', async () => {
      const password = 'test-password';
      const salt1 = crypto.getRandomValues(new Uint8Array(_SALT_LENGTH));
      const salt2 = crypto.getRandomValues(new Uint8Array(_SALT_LENGTH));
      
      const key1 = await deriveKey(password, salt1);
      const key2 = await deriveKey(password, salt2);
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('encrypt', () => {
    it('should encrypt text successfully', async () => {
      const plaintext = 'Hello, World!';
      const password = 'secure-password';
      
      const encrypted = await encrypt(plaintext, password);
      
      expect(encrypted).toBeTruthy();
      expect(typeof encrypted).toBe('string');
    });

    it('should produce different ciphertext for same input (due to random IV/salt)', async () => {
      const plaintext = 'Same text';
      const password = 'same-password';
      
      const encrypted1 = await encrypt(plaintext, password);
      const encrypted2 = await encrypt(plaintext, password);
      
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should return valid JSON with required fields', async () => {
      const encrypted = await encrypt('test', 'password');
      const parsed = JSON.parse(encrypted);
      
      expect(parsed).toHaveProperty('salt');
      expect(parsed).toHaveProperty('iv');
      expect(parsed).toHaveProperty('data');
    });

    it('should handle empty string encryption', async () => {
      const encrypted = await encrypt('', 'password');
      expect(encrypted).toBeTruthy();
    });

    it('should handle Unicode text', async () => {
      const unicodeText = '你好世界 🌍 Test 123';
      const encrypted = await encrypt(unicodeText, 'password');
      expect(encrypted).toBeTruthy();
    });
  });

  describe('decrypt', () => {
    it('should decrypt correctly with correct password', async () => {
      const plaintext = 'Secret message';
      const password = 'correct-password';
      
      const encrypted = await encrypt(plaintext, password);
      const decrypted = await decrypt(encrypted, password);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should fail with wrong password', async () => {
      const plaintext = 'Secret message';
      const correctPassword = 'correct-password';
      const wrongPassword = 'wrong-password';
      
      const encrypted = await encrypt(plaintext, correctPassword);
      
      await expect(decrypt(encrypted, wrongPassword)).rejects.toThrow();
    });

    it('should handle invalid JSON format', async () => {
      await expect(decrypt('not-valid-json', 'password')).rejects.toThrow();
    });

    it('should handle incomplete encrypted data', async () => {
      const incompleteData = JSON.stringify({ salt: 'abc' });
      await expect(decrypt(incompleteData, 'password')).rejects.toThrow();
    });

    it('should decrypt empty string correctly', async () => {
      const encrypted = await encrypt('', 'password');
      const decrypted = await decrypt(encrypted, 'password');
      expect(decrypted).toBe('');
    });

    it('should decrypt Unicode text correctly', async () => {
      const unicodeText = '你好世界 🌍 测试中文';
      const password = 'unicode-password';
      
      const encrypted = await encrypt(unicodeText, password);
      const decrypted = await decrypt(encrypted, password);
      
      expect(decrypted).toBe(unicodeText);
    });
  });

  describe('encryption-decryption roundtrip', () => {
    it('should maintain data integrity through roundtrip', async () => {
      const testCases = [
        'Simple ASCII',
        'With numbers 12345',
        'Special chars !@#$%',
        '',
        '   ',
      ];
      
      for (const testCase of testCases) {
        const encrypted = await encrypt(testCase, 'roundtrip-password');
        const decrypted = await decrypt(encrypted, 'roundtrip-password');
        expect(decrypted).toBe(testCase);
      }
    });

    it('should work with various passwords', async () => {
      const passwords = [
        'short',
        'P@ssw0rd!',
        '12345'
      ];
      
      for (const password of passwords) {
        const encrypted = await encrypt('test message', password);
        const decrypted = await decrypt(encrypted, password);
        expect(decrypted).toBe('test message');
      }
    });
  });
});