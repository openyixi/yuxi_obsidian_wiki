# Windows 终端中文文件名乱码：UTF-8 排障与修复

> 适用环境：Windows 10/11、PowerShell 7、CMD、Cmder、VS Code 集成终端和 Git。  
> 本机验证日期：2026-10-02。  
> 本次问题：UTF-8 中文文件名被按 GBK/代码页 936 解码。

## 一、典型现象

原本的文件名：

```text
ESP32开发环境搭建-Windows-ESP-IDF.md
Snap-Camera-OBS-高质量口播工作流.md
```

在某些终端或程序中显示为：

```text
ESP32寮€鍙戠幆澧冩惌寤Windows-ESP-IDF.md
Snap-Camera-OBS-楂樿川閲忓彛鎾伐浣滄祦.md
```

`寮€鍙戠幆澧冩惌寤`、`楂樿川閲忓彛鎾伐浣滄祦` 这类文字是典型的乱码（mojibake）：数据本身是 UTF-8，但显示端错误地使用 GBK 解码。

遇到这种情况不要急着重命名文件。应先判断是：

1. 文件名本身已经损坏；
2. 文件名正常，只是终端显示编码错误；
3. 文件内容编码错误，与文件名无关。

## 二、先确认文件名是否真的损坏

在仓库根目录运行：

```powershell
git status --short
git ls-files
Get-ChildItem | Select-Object Name
```

如果 Git 或其中一个支持 UTF-8 的工具能正确显示中文，说明磁盘上的文件名通常没有损坏，只需要修复终端编码，不应重命名文件。

Git 如果把中文显示成 `\xxx\xxx` 形式，这不是文件名损坏，而是 Git 默认转义了非 ASCII 字符。可执行：

```powershell
git config --global core.quotepath false
```

验证：

```powershell
git config --global --get core.quotepath
```

应输出：

```text
false
```

## 三、检查当前终端编码

### 3.1 检查 Windows 活动代码页

```powershell
chcp
```

常见结果：

- `936`：简体中文 GBK，容易与 UTF-8 工具产生乱码；
- `65001`：UTF-8。

### 3.2 检查 PowerShell 编码

```powershell
[PSCustomObject]@{
    PowerShell       = $PSVersionTable.PSVersion.ToString()
    InputEncoding    = [Console]::InputEncoding.WebName
    OutputEncoding   = [Console]::OutputEncoding.WebName
    PipelineEncoding = $OutputEncoding.WebName
} | Format-List
```

预期三个编码字段均为 `utf-8`。

## 四、修复 PowerShell 7

仅在当前窗口临时切换：

```powershell
chcp 65001
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
$OutputEncoding = [Console]::OutputEncoding
```

要让新终端永久生效，先查看配置文件位置：

```powershell
$PROFILE
```

必要时创建配置文件：

```powershell
New-Item -ItemType File -Path $PROFILE -Force
```

编辑 `$PROFILE`，加入：

```powershell
# Use UTF-8 consistently for Chinese filenames and command output.
chcp 65001 | Out-Null
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
$OutputEncoding = [Console]::OutputEncoding
```

本机配置文件位置：

```text
C:\Users\zyx\Documents\PowerShell\Microsoft.PowerShell_profile.ps1
```

关闭并重新打开 PowerShell，然后再次运行 `chcp` 和编码检查命令。

## 五、修复 Cmder

Cmder 默认通常启动 CMD。即使 ConEmu 界面能显示 Unicode，内部 CMD 仍可能使用代码页 936。

找到当前使用的 Cmder 目录，然后编辑：

```text
<Cmder目录>\config\user_profile.cmd
```

在文件末尾加入：

```bat
@echo off
chcp 65001 >nul
```

本机发现了两份便携版 Cmder，因此两份均已修复：

```text
D:\workspace\tools\cmder\config\user_profile.cmd
C:\Users\zyx\Desktop\Downloads\cmder\config\user_profile.cmd
```

如果不知道 Cmder 在哪里，可以运行：

```powershell
where.exe /R D:\ Cmder.exe
where.exe /R C:\Users\你的用户名 Cmder.exe
```

修改后必须关闭所有旧 Cmder 窗口，再重新启动。运行以下命令验证：

```bat
chcp
dir
```

`chcp` 应显示 `65001`，`dir` 应正确显示中文文件名。

## 六、修复 VS Code 集成终端

VS Code 若没有明确指定默认终端，会根据系统环境自动选择 CMD、Windows PowerShell 或 PowerShell 7。为避免不同电脑或升级后发生变化，可固定使用已配置 UTF-8 的 PowerShell 7。

打开 VS Code 的 `settings.json`：

1. 按 `Ctrl+Shift+P`；
2. 输入并选择 `Preferences: Open User Settings (JSON)`；
3. 加入以下配置。

```json
{
    "terminal.integrated.profiles.windows": {
        "PowerShell 7 (UTF-8)": {
            "path": "C:\\Program Files\\PowerShell\\7\\pwsh.exe",
            "args": [
                "-NoLogo"
            ]
        }
    },
    "terminal.integrated.defaultProfile.windows": "PowerShell 7 (UTF-8)"
}
```

如果原文件已有其他设置，只加入这两个字段，不要用上面的完整示例覆盖原文件。

本机 VS Code 用户配置位置：

```text
C:\Users\zyx\AppData\Roaming\Code\User\settings.json
```

修改后关闭 VS Code 中已有的终端，再新建终端。旧终端进程不会自动切换编码。

验证：

```powershell
chcp
[Console]::InputEncoding.WebName
[Console]::OutputEncoding.WebName
$OutputEncoding.WebName
Get-ChildItem | Select-Object Name
```

预期代码页为 `65001`，三个编码结果均为 `utf-8`，中文文件名显示正常。

## 七、快速排障清单

以后再次出现乱码时，按下面的顺序检查：

1. 用 `git status --short` 和 `Get-ChildItem` 判断文件名本身是否正常；
2. 用 `chcp` 检查当前 shell 是否仍为代码页 936；
3. 检查当前终端到底是 CMD、Windows PowerShell、PowerShell 7、Git Bash 还是 WSL；
4. PowerShell 7 检查 `$PROFILE` 是否被加载；
5. Cmder 检查实际启动的是哪一份便携目录，以及对应的 `user_profile.cmd`；
6. VS Code 检查新建终端时选择的默认配置；
7. Git 单独检查 `core.quotepath`；
8. 修改后关闭旧终端并新建，不要在旧进程中判断是否生效。

## 八、注意事项

- `chcp 65001` 只影响执行它的 CMD/PowerShell 进程及其子进程，不能修改已经打开的其他终端。
- 文件名乱码、文件内容乱码和字体缺字是三类不同问题。字体缺字通常显示方框，不会显示成 `寮€鍙` 这类可读但错误的汉字。
- 某些非常旧的软件只支持本地代码页。若切换到 UTF-8 后旧工具异常，可只对现代开发终端启用 UTF-8，不必修改整个系统的“非 Unicode 程序语言”设置。
- 不建议为了修复终端乱码直接批量重命名文件，否则可能把原本正确的文件名真正改坏。
- `Set-PSReadLineOption` 在输出被重定向或不支持虚拟终端的环境中可能显示警告。这与中文编码设置无关，在正常交互式终端中通常不会出现。

## 九、本次实际修复结果

本机最终配置为：

| 项目 | 结果 |
| --- | --- |
| PowerShell 版本 | 7.6.6 |
| Windows 活动代码页 | 65001 |
| PowerShell 输入编码 | UTF-8 |
| PowerShell 输出编码 | UTF-8 |
| PowerShell 管道编码 | UTF-8 |
| Git `core.quotepath` | `false` |
| Cmder 两份启动配置 | 均为代码页 65001 |
| VS Code 默认终端 | `PowerShell 7 (UTF-8)` |

