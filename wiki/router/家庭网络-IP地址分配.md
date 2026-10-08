---
tags:
  - 网络
  - WireGuard
  - IP地址管理
updated: 2026-10-08
---

# 家庭网络 IP 地址分配

## WireGuard 地址

| IP 地址 | 设备 | 用途 | 状态 | 备注 |
| --- | --- | --- | --- | --- |
| `192.168.201.1` | 华硕 RT-AX86U Pro | WireGuard 服务端 | 使用中 | 路由器 WireGuard 接口 |
| `192.168.201.2` | iPhone | WireGuard 客户端 | 已占用 | `Remote-Client-1`，不要再分配给其他设备 |
| `192.168.201.3` | Mac | WireGuard 客户端 | 已占用 | `Remote-Mac`，不要再分配给其他设备 |

## 相关网络

- 华硕路由器 LAN：`192.168.50.0/24`
- WireGuard：`192.168.201.0/24`
- iPhone 通过 WireGuard 访问家庭网络及路由器上的 Clash 代理。
- ShellCrash 会将来自 `192.168.201.0/24` 的 WireGuard 客户端自动加入透明代理范围。

## 变更记录

- 2026-10-08：确认 `192.168.201.2` 已分配给 iPhone。
- 2026-10-08：分配 `192.168.201.3` 给 Mac，并将整个 `192.168.201.0/24` 纳入 ShellCrash 透明代理。
