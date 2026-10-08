# ESP32 开发环境搭建（Windows + ESP-IDF）

> 适用环境：Windows 10/11、PowerShell、VS Code。  
> 本机验证环境：ESP-IDF 5.5.2、Python 3.13.9、ESP32（经典款）。  
> 最后验证日期：2026-10-02。

## 1. 最终目标

完成后应具备以下能力：

- 在 PowerShell 中运行 `idf.py`；
- 使用 ESP32 交叉编译器、CMake 和 Ninja；
- 编译 ESP-IDF 的 `hello_world` 示例；
- 通过串口把固件烧录到开发板；
- 使用串口监视器查看运行日志；
- 在 VS Code 中使用 Espressif 官方扩展。

## 2. 本机已经安装的位置

本机当前使用的主要路径如下：

| 内容 | 路径 |
| --- | --- |
| ESP-IDF | `C:\Espressif\frameworks\esp-idf-v5.5.2` |
| ESP-IDF 工具目录 | `C:\Espressif\tools` |
| Python 虚拟环境 | `C:\Espressif\python_env\idf5.5_py3.13_env` |
| 测试工程 | `C:\Users\zyx\Documents\ChatGPT\robot\hello_world` |
| 环境激活脚本 | `C:\Users\zyx\Documents\ChatGPT\robot\activate-esp-idf.ps1` |

## 3. 全新安装方法

ESP-IDF 6.x 及后续版本在 Windows 上推荐使用 Espressif Installation Manager（EIM）。

### 3.1 检查基础工具

打开 PowerShell：

```powershell
git --version
python --version
code --version
```

ESP-IDF 要求 Python 3.10 或更高版本。如果缺少 Git 或 Python，EIM 通常也会提示并帮助安装。

### 3.2 安装 EIM

安装图形版：

```powershell
winget install Espressif.EIM
```

或者安装命令行版：

```powershell
winget install Espressif.EIM-CLI
```

命令行版安装最新版稳定 ESP-IDF：

```powershell
eim install
```

如果 `eim` 暂时无法识别，关闭 PowerShell，再重新打开。也可以使用图形版 EIM，选择 **New Installation → Easy Installation**。

官方安装说明：<https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/windows-setup.html>

## 4. 修复已有 ESP-IDF 安装

本次机器上实际已经存在 ESP-IDF 5.3.1 和 5.5.2，但 5.5.2 对应的 Python 虚拟环境丢失，因此直接运行 `export.ps1` 时出现：

```text
ESP-IDF Python virtual environment ... not found
```

修复方法是运行该版本自带的安装脚本：

```powershell
& 'C:\Espressif\frameworks\esp-idf-v5.5.2\install.ps1' esp32
```

该命令会：

- 检查并安装 ESP32 交叉编译工具链；
- 安装 CMake、Ninja、OpenOCD、esptool 等工具；
- 创建匹配当前 Python 版本的虚拟环境；
- 安装 ESP-IDF 所需的 Python 包。

执行结束时应看到：

```text
All done! You can now run:
    export.ps1
```

## 5. 激活开发环境

每次新开普通 PowerShell 后，都要先激活 ESP-IDF：

```powershell
$env:IDF_TOOLS_PATH = 'C:\Espressif'
. 'C:\Espressif\frameworks\esp-idf-v5.5.2\export.ps1'
```

本机也准备了快捷脚本：

```powershell
cd C:\Users\zyx\Documents\ChatGPT\robot
. .\activate-esp-idf.ps1
```

注意第一个点和脚本路径之间有一个空格；这是 PowerShell 的“点调用”，可让环境变量保留在当前终端中。

验证工具：

```powershell
where.exe idf.py
where.exe xtensa-esp32-elf-gcc
xtensa-esp32-elf-gcc --version
```

## 6. 安装 VS Code 扩展

在 VS Code 扩展市场搜索并安装：

```text
Espressif IDF
```

扩展 ID 是：

```text
espressif.esp-idf-extension
```

也可以从命令行安装：

```powershell
code --install-extension espressif.esp-idf-extension
```

如果扩展要求配置 ESP-IDF 路径，选择：

```text
C:\Espressif\frameworks\esp-idf-v5.5.2
```

## 7. 编译第一个工程

### 7.1 获取 hello_world 示例

可以直接复制 ESP-IDF 自带示例：

```powershell
Copy-Item `
  -LiteralPath 'C:\Espressif\frameworks\esp-idf-v5.5.2\examples\get-started\hello_world' `
  -Destination 'C:\Users\zyx\Documents\ChatGPT\robot\hello_world' `
  -Recurse
```

本机已经复制完成，不需要重复执行。

### 7.2 进入工程目录

```powershell
cd C:\Users\zyx\Documents\ChatGPT\robot\hello_world
```

一定要进入包含 `CMakeLists.txt` 的工程根目录。可以检查：

```powershell
Get-Item .\CMakeLists.txt
```

### 7.3 选择芯片型号

经典 ESP32：

```powershell
idf.py set-target esp32
```

其他常见型号：

```powershell
idf.py set-target esp32s3
idf.py set-target esp32c3
idf.py set-target esp32c6
```

目标型号通常只需要设置一次。切换目标会重新生成 `sdkconfig`，切换前应确认现有配置是否需要保存。

### 7.4 编译

```powershell
idf.py build
```

成功时会看到：

```text
Project build complete. To flash, run:
 idf.py flash
```

本次实际生成的主要文件：

```text
build\bootloader\bootloader.bin
build\partition_table\partition-table.bin
build\hello_world.bin
```

本次 `hello_world.bin` 大小为 137,296 字节，完整编译已经通过。

## 8. 连接开发板并烧录

### 8.1 查找串口

插入 ESP32 开发板后执行：

```powershell
Get-CimInstance Win32_SerialPort | Select-Object DeviceID, Name
```

也可以在“设备管理器 → 端口（COM 和 LPT）”中查看。常见 USB 转串口芯片是 CP210x 或 CH340；如果没有出现 COM 端口，需要安装对应驱动或更换支持数据传输的 USB 线。

### 8.2 烧录并查看日志

假设端口是 `COM3`：

```powershell
idf.py -p COM3 flash monitor
```

只烧录：

```powershell
idf.py -p COM3 flash
```

只打开串口监视器：

```powershell
idf.py -p COM3 monitor
```

按 `Ctrl+]` 退出串口监视器。

部分开发板在烧录时需要按住 **BOOT**，看到连接开始后再松开。如果一直显示连接失败，可按一下 **EN/RESET** 后重试。

## 9. 常见问题

### 9.1 找不到 `idf.py`

原因：当前 PowerShell 尚未激活 ESP-IDF。

```powershell
$env:IDF_TOOLS_PATH = 'C:\Espressif'
. 'C:\Espressif\frameworks\esp-idf-v5.5.2\export.ps1'
```

### 9.2 提示 Python 虚拟环境不存在

```powershell
& 'C:\Espressif\frameworks\esp-idf-v5.5.2\install.ps1' esp32
```

完成后重新执行 `export.ps1`。

### 9.3 `CMakeLists.txt not found in project directory`

原因：命令运行在错误目录。

```powershell
cd C:\Users\zyx\Documents\ChatGPT\robot\hello_world
idf.py build
```

### 9.4 编译器存在，但 CMake 报找不到编译器

先检查环境是否真的激活：

```powershell
where.exe xtensa-esp32-elf-gcc
xtensa-esp32-elf-gcc --version
```

如果第一条没有结果，重新运行 `export.ps1`。如果直接运行编译器成功，但某个受限终端内的 CMake 仍报找不到，换到普通用户 PowerShell 或“ESP-IDF PowerShell”中编译。

### 9.5 `build` 目录损坏，`fullclean` 拒绝删除

确认当前位于正确工程目录后，手动删除该工程自己的 `build` 目录：

```powershell
Remove-Item -LiteralPath .\build -Recurse -Force
idf.py build
```

不要把路径写成工作区根目录、用户目录或磁盘根目录。

### 9.6 无法连接串口

依次检查：

1. USB 线是否支持数据传输；
2. 设备管理器中是否出现 COM 端口；
3. COM 端口是否被其他串口工具占用；
4. 是否选对芯片目标；
5. 是否需要按住 BOOT 再开始烧录；
6. CP210x/CH340 驱动是否正确安装。

## 10. 日常使用速查

```powershell
# 1. 进入工作区并激活环境
cd C:\Users\zyx\Documents\ChatGPT\robot
. .\activate-esp-idf.ps1

# 2. 进入工程
cd .\hello_world

# 3. 编译
idf.py build

# 4. 烧录并查看日志（按实际端口修改）
idf.py -p COM3 flash monitor
```

只要以上四步能够完成，ESP32 开发环境就是正常的。
