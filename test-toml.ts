// 测试TOML转换功能
import { tomlToJson, jsonToToml } from './lib/converters/toml/index.ts';

// 测试TOML数据
const testToml = `title = "TOML Example"

[owner]
name = "Tom Preston-Werner"
dob = 1979-05-27T07:32:00-08:00

[database]
enabled = true
ports = [ 8000, 8001, 8002 ]
data = [ [ 1, 2 ], [ 3, 4 ] ]
temp_targets = { cpu = 79.5, case = 72.0 }

[servers]

[servers.alpha]
ip = "10.0.0.1"
role = "frontend"

[servers.beta]
ip = "10.0.0.2"
role = "backend"`;

console.log('=== 测试 TOML 到 JSON 转换 ===');
try {
  const jsonResult = tomlToJson(testToml);
  console.log('TOML 到 JSON 转换成功！');
  console.log('JSON 结果:', JSON.stringify(jsonResult, null, 2));
  
  console.log('\n=== 测试 JSON 到 TOML 转换 ===');
  const tomlResult = jsonToToml(jsonResult);
  console.log('JSON 到 TOML 转换成功！');
  console.log('TOML 结果:', tomlResult);
  
  console.log('\n🎉 TOML/JSON 互转功能测试通过！');
} catch (error) {
  console.error('❌ 转换失败:', error instanceof Error ? error.message : error);
}