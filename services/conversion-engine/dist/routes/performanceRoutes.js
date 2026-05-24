"use strict";
/**
 * @file 性能监控路由
 * @description 提供服务性能指标的接口
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceRoutes = void 0;
const express_1 = require("express");
/**
 * 创建性能监控路由
 * @param options 路由选项
 */
const performanceRoutes = (options) => {
    const router = (0, express_1.Router)();
    const { systemMonitor } = options;
    /**
     * 获取当前系统性能指标
     * @route GET /performance/system
     */
    router.get('/system', (req, res) => {
        const status = systemMonitor.getCurrentStatus();
        res.status(200).json({
            status: 'ok',
            data: status
        });
    });
    /**
     * 获取内存使用情况
     * @route GET /performance/memory
     */
    router.get('/memory', (req, res) => {
        const status = systemMonitor.getCurrentStatus();
        res.status(200).json({
            status: 'ok',
            data: status.memory
        });
    });
    /**
     * 获取CPU使用情况
     * @route GET /performance/cpu
     */
    router.get('/cpu', (req, res) => {
        const status = systemMonitor.getCurrentStatus();
        res.status(200).json({
            status: 'ok',
            data: status.cpu
        });
    });
    /**
     * 获取磁盘使用情况
     * @route GET /performance/disk
     */
    router.get('/disk', (req, res) => {
        const status = systemMonitor.getCurrentStatus();
        res.status(200).json({
            status: 'ok',
            data: status.disk
        });
    });
    /**
     * 获取系统负载
     * @route GET /performance/load
     */
    router.get('/load', (req, res) => {
        const status = systemMonitor.getCurrentStatus();
        res.status(200).json({
            status: 'ok',
            data: {
                loadAverage: status.loadAverage,
                cores: status.cpu.cores
            }
        });
    });
    /**
     * 获取网络接口信息
     * @route GET /performance/network
     */
    router.get('/network', (req, res) => {
        const status = systemMonitor.getCurrentStatus();
        res.status(200).json({
            status: 'ok',
            data: status.network
        });
    });
    return router;
};
exports.performanceRoutes = performanceRoutes;
exports.default = exports.performanceRoutes;
//# sourceMappingURL=performanceRoutes.js.map