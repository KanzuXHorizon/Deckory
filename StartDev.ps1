#Requires -Version 5.1
<#
.SYNOPSIS
  DevSpace MCP Tunnel Launcher for ChatGPT (cloudflared + OAuth)

.DESCRIPTION
  One-command launcher for @waishnav/devspace on Windows:
  - validates Node, Git Bash, npm, cloudflared, and the repository path
  - can install the DevSpace CLI and cloudflared when missing with -InstallMissing
  - validates the selected DevSpace port and only stops its owner with -ForcePortCleanup
  - starts a Cloudflare Quick Tunnel, or a Named Tunnel when configured
  - isolates config, OAuth, state, worktrees, ports, and logs per profile/session
  - supports up to three concurrent sessions for different repositories
  - defaults to the Codex-oriented profile for large repositories and bug fixing
  - starts DevSpace with the correct publicBaseUrl and Host allowlist
  - verifies local and public OAuth metadata
  - prints and copies the ChatGPT MCP connector URL

  Default coding profile:
    ToolMode = codex
    Widgets  = off

  Concurrent session preferred ports:
    Session 1 = 7676, then 7686, 7696, ... when busy
    Session 2 = 7677, then 7687, 7697, ... when busy
    Session 3 = 7678, then 7688, 7698, ... when busy

  TunnelMode defaults to named. On first run, the launcher can prompt for a public
  hostname, authenticate cloudflared, create/reuse a locally-managed Named Tunnel,
  create its DNS route, and persist the setup per profile/session.

  Existing remotely-managed tunnels are still supported by providing both
  -PublicBaseUrl and -TunnelTokenFile.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\Start-DevSpace-MCP-Cloudflared.ps1

.EXAMPLE
  .\Start-DevSpace-MCP-Cloudflared.ps1 -InstallMissing

.EXAMPLE
  .\Start-DevSpace-MCP-Cloudflared.ps1 -Profile myinterview -Session 1 `
    -Repo "Z:\FPT_POLYTECHNIC\MyInterview\MyIntervewProject"

.EXAMPLE
  .\Start-DevSpace-MCP-Cloudflared.ps1 -Profile project-b -Session 2 `
    -Repo "D:\Projects\ProjectB"

.EXAMPLE
  .\Start-DevSpace-MCP-Cloudflared.ps1 -Profile project-c -Session 3 `
    -Repo "E:\Projects\ProjectC"

.EXAMPLE
  # First local Named Tunnel run: prompts for hostname, logs in, creates tunnel + DNS.
  .\Start-DevSpace-MCP-Cloudflared.ps1 -TunnelMode named

.EXAMPLE
  # Fully specified locally-managed Named Tunnel; no hostname prompt.
  .\Start-DevSpace-MCP-Cloudflared.ps1 `
    -TunnelMode named `
    -TunnelName "myinterview-devspace" `
    -PublicBaseUrl "https://devspace.example.com"

.EXAMPLE
  # Existing remotely-managed tunnel using a dashboard/API token.
  .\Start-DevSpace-MCP-Cloudflared.ps1 `
    -TunnelMode named `
    -PublicBaseUrl "https://devspace.example.com" `
    -TunnelTokenFile "$env:USERPROFILE\.cloudflared\devspace-token.txt"

.EXAMPLE
  .\Start-DevSpace-MCP-Cloudflared.ps1 -ToolMode full -Widgets full
#>

[CmdletBinding()]
param(
  [string]$Repo = "F:\Deckory",

  [Alias("Profile")]
  [string]$ProfileName = "",

  [ValidateRange(1, 3)]
  [int]$Session = 1,

  [ValidateRange(0, 65535)]
  [int]$Port = 4934,

  [ValidateSet("minimal", "full", "codex")]
  [string]$ToolMode = "full",

  [ValidateSet("full", "changes", "off")]
  [string]$Widgets = "off",

  [ValidateSet("auto", "quick", "named")]
  [string]$TunnelMode = "named",

  [string]$PublicBaseUrl = "",
  [string]$TunnelTokenFile = "",
  [string]$TunnelName = "",

  [switch]$InstallMissing,
  [switch]$NonInteractive,
  [switch]$ResetNamedTunnelState,
  [switch]$OverwriteDns,
  [switch]$NoClipboard,
  [switch]$ShowOwnerToken,
  [switch]$ForcePortCleanup
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = "Stop"

$script:CloudflaredProcess = $null
$script:DevSpaceProcess = $null
$script:InstanceName = $null
$script:CloudflaredLog = $null
$script:CloudflaredStdoutLog = $null
$script:CloudflaredErrorLog = $null
$script:DevSpaceLog = $null
$script:DevSpaceErrorLog = $null

function Write-Step {
  param(
    [int]$Current,
    [int]$Total,
    [string]$Message,
    [ConsoleColor]$Color = [ConsoleColor]::Yellow
  )

  Write-Host ""
  Write-Host "[$Current/$Total] $Message" -ForegroundColor $Color
}

function Resolve-ProfileName {
  param(
    [string]$RequestedProfile,
    [Parameter(Mandatory = $true)][string]$RepositoryPath
  )

  if (-not [string]::IsNullOrWhiteSpace($RequestedProfile)) {
    $candidate = $RequestedProfile.Trim()
    if ($candidate -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]{0,47}$') {
      throw "Profile must start with a letter or number and contain only letters, numbers, dot, underscore, or dash (max 48 characters). Received: $RequestedProfile"
    }

    return $candidate
  }

  $repositoryName = Split-Path -Leaf $RepositoryPath
  $candidate = [regex]::Replace($repositoryName, '[^A-Za-z0-9._-]+', '-')
  $candidate = $candidate.Trim([char[]]@('.', '-', '_'))
  if ([string]::IsNullOrWhiteSpace($candidate)) {
    throw "Cannot derive a valid profile name from repository path: $RepositoryPath. Pass -Profile explicitly."
  }

  if ($candidate.Length -gt 48) {
    $candidate = $candidate.Substring(0, 48).TrimEnd([char[]]@('.', '-', '_'))
  }

  return $candidate
}

function Initialize-InstancePaths {
  param(
    [Parameter(Mandatory = $true)][string]$ProfileName,
    [Parameter(Mandatory = $true)][int]$SessionNumber
  )

  $script:InstanceName = "$ProfileName-s$SessionNumber"
  $configDirectory = Join-Path $env:USERPROFILE ".devspace\profiles\$ProfileName\session-$SessionNumber"
  $stateDirectory = Join-Path $configDirectory "state"
  $worktreeDirectory = Join-Path $configDirectory "worktrees"
  $logDirectory = Join-Path $env:TEMP "devspace\$($script:InstanceName)"

  New-Item -ItemType Directory -Path $configDirectory -Force | Out-Null
  New-Item -ItemType Directory -Path $stateDirectory -Force | Out-Null
  New-Item -ItemType Directory -Path $worktreeDirectory -Force | Out-Null
  New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

  $script:CloudflaredLog = Join-Path $logDirectory "cloudflared.log"
  $script:CloudflaredStdoutLog = Join-Path $logDirectory "cloudflared.stdout.log"
  $script:CloudflaredErrorLog = Join-Path $logDirectory "cloudflared.stderr.log"
  $script:DevSpaceLog = Join-Path $logDirectory "devspace.stdout.log"
  $script:DevSpaceErrorLog = Join-Path $logDirectory "devspace.stderr.log"

  return [pscustomobject]@{
    Name              = $script:InstanceName
    ConfigDirectory   = $configDirectory
    StateDirectory    = $stateDirectory
    WorktreeDirectory = $worktreeDirectory
    LogDirectory      = $logDirectory
  }
}

function Get-ExecutablePath {
  param([Parameter(Mandatory = $true)][string[]]$Names)

  foreach ($name in $Names) {
    $command = Get-Command $name -ErrorAction SilentlyContinue
    if ($command) {
      return $command.Source
    }
  }

  return $null
}

function Quote-NativeArgument {
  param([Parameter(Mandatory = $true)][string]$Value)

  if ($Value -notmatch '[\s"]') {
    return $Value
  }

  return '"' + $Value.Replace('"', '\"') + '"'
}

function Get-PortOwnerProcessIds {
  param([Parameter(Mandatory = $true)][int]$LocalPort)

  $connectionCommand = Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue
  if (-not $connectionCommand) {
    throw "Get-NetTCPConnection is unavailable; cannot verify port $LocalPort safely."
  }

  return @(
    Get-NetTCPConnection -LocalPort $LocalPort -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    Where-Object { $_ -and $_ -ne $PID }
  )
}

function Ensure-PortAvailable {
  param(
    [Parameter(Mandatory = $true)][int]$LocalPort,
    [switch]$Force
  )

  $processIds = @(Get-PortOwnerProcessIds -LocalPort $LocalPort)
  if ($processIds.Count -eq 0) {
    return
  }

  if (-not $Force) {
    throw "Port $LocalPort is owned by PID(s) $($processIds -join ', '). Re-run with -ForcePortCleanup to stop them."
  }

  foreach ($processId in $processIds) {
    Stop-Process -Id $processId -Force -ErrorAction Stop
  }

  Start-Sleep -Milliseconds 500
  if (@(Get-PortOwnerProcessIds -LocalPort $LocalPort).Count -gt 0) {
    throw "Port $LocalPort is still in use after cleanup."
  }
}

function Resolve-SessionPort {
  param(
    [Parameter(Mandatory = $true)][int]$RequestedPort,
    [Parameter(Mandatory = $true)][int]$SessionNumber,
    [int]$MaximumAttempts = 20
  )

  if ($RequestedPort -gt 0) {
    return $RequestedPort
  }

  $preferredPort = 7675 + $SessionNumber
  for ($attempt = 0; $attempt -lt $MaximumAttempts; $attempt++) {
    $candidatePort = $preferredPort + ($attempt * 10)
    if ($candidatePort -gt 65535) {
      break
    }

    if (@(Get-PortOwnerProcessIds -LocalPort $candidatePort).Count -eq 0) {
      return $candidatePort
    }
  }

  throw "No available port found for session $SessionNumber after $MaximumAttempts attempts. Pass -Port explicitly."
}

function Test-TcpPort {
  param(
    [string]$HostName = "127.0.0.1",
    [Parameter(Mandatory = $true)][int]$LocalPort,
    [int]$TimeoutMilliseconds = 600
  )

  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $asyncResult = $client.BeginConnect($HostName, $LocalPort, $null, $null)
    if (-not $asyncResult.AsyncWaitHandle.WaitOne($TimeoutMilliseconds, $false)) {
      return $false
    }

    $client.EndConnect($asyncResult)
    return $client.Connected
  }
  catch {
    return $false
  }
  finally {
    $client.Close()
  }
}

function Wait-ForTcpPort {
  param(
    [Parameter(Mandatory = $true)][int]$LocalPort,
    [Parameter(Mandatory = $true)][System.Diagnostics.Process]$Process,
    [int]$TimeoutSeconds = 30
  )

  $watch = [Diagnostics.Stopwatch]::StartNew()
  while ($watch.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
    if ($Process.HasExited) {
      return $false
    }

    if (Test-TcpPort -LocalPort $LocalPort) {
      return $true
    }

    Start-Sleep -Milliseconds 400
  }

  return $false
}

function Get-CloudflaredPublicUrl {
  param([int]$TimeoutSeconds = 45)

  $urlPattern = 'https://[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.trycloudflare\.com'
  $watch = [Diagnostics.Stopwatch]::StartNew()

  while ($watch.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
    if ($script:CloudflaredProcess -and $script:CloudflaredProcess.HasExited) {
      break
    }

    foreach ($path in @(
        $script:CloudflaredLog,
        $script:CloudflaredStdoutLog,
        $script:CloudflaredErrorLog
      )) {
      if (-not (Test-Path $path)) {
        continue
      }

      $content = Get-Content -Raw $path -ErrorAction SilentlyContinue
      if ($content -and $content -match $urlPattern) {
        return ([string]$Matches[0]).TrimEnd("/")
      }
    }

    Start-Sleep -Milliseconds 500
  }

  return $null
}

function Normalize-PublicBaseUrl {
  param([Parameter(Mandatory = $true)][string]$Value)

  $candidate = $Value.Trim()
  if ($candidate -notmatch '^[A-Za-z][A-Za-z0-9+.-]*://') {
    $candidate = "https://$candidate"
  }

  $uri = $null
  if (-not [Uri]::TryCreate($candidate, [UriKind]::Absolute, [ref]$uri)) {
    throw "PublicBaseUrl/hostname không hợp lệ: $Value"
  }

  if ($uri.Scheme -ne "https") {
    throw "PublicBaseUrl phải dùng HTTPS. Giá trị nhận được: $Value"
  }

  if ($uri.AbsolutePath -ne "/" -or $uri.Query -or $uri.Fragment -or -not $uri.Host) {
    throw "PublicBaseUrl chỉ được là origin/hostname, không chứa /mcp, path, query hoặc fragment. Giá trị nhận được: $Value"
  }

  $hostname = $uri.DnsSafeHost.TrimEnd([char]".")
  $ipAddress = $null
  $isIpAddress = [System.Net.IPAddress]::TryParse($hostname, [ref]$ipAddress)
  if ($hostname -notmatch '\.' -or $hostname -eq "localhost" -or $isIpAddress) {
    throw @"
PublicBaseUrl phải dùng hostname đầy đủ (FQDN), ví dụ:
  https://myinterviewconnector.hzi.io.vn

Không dùng hostname rút gọn như:
  https://myinterviewconnector
"@
  }

  return $uri.GetLeftPart([UriPartial]::Authority).TrimEnd("/")
}

function Read-HostWithDefault {
  param(
    [Parameter(Mandatory = $true)][string]$Prompt,
    [string]$DefaultValue = "",
    [switch]$Required
  )

  $label = $Prompt
  if (-not [string]::IsNullOrWhiteSpace($DefaultValue)) {
    $label += " [$DefaultValue]"
  }

  while ($true) {
    $value = Read-Host $label
    if ([string]::IsNullOrWhiteSpace($value)) {
      $value = $DefaultValue
    }

    if (-not $Required -or -not [string]::IsNullOrWhiteSpace($value)) {
      return $value.Trim()
    }

    Write-Host "  Giá trị này không được để trống." -ForegroundColor Yellow
  }
}

function Resolve-CloudflaredTunnelName {
  param(
    [string]$RequestedName,
    [Parameter(Mandatory = $true)][string]$DefaultName
  )

  $candidate = if ([string]::IsNullOrWhiteSpace($RequestedName)) {
    $DefaultName
  }
  else {
    $RequestedName.Trim()
  }

  $candidate = [regex]::Replace($candidate, '[^A-Za-z0-9_-]+', '-')
  $candidate = $candidate.Trim([char[]]@('-', '_'))
  if ([string]::IsNullOrWhiteSpace($candidate)) {
    throw "Không thể tạo tên Cloudflare Tunnel hợp lệ. Dùng -TunnelName để chỉ định tên khác."
  }

  if ($candidate.Length -gt 64) {
    $candidate = $candidate.Substring(0, 64).TrimEnd([char[]]@('-', '_'))
  }

  return $candidate
}

function Get-CloudflaredHomeDirectory {
  $directory = Join-Path $env:USERPROFILE ".cloudflared"
  New-Item -ItemType Directory -Path $directory -Force | Out-Null
  return $directory
}

function Invoke-CloudflaredCommand {
  param(
    [Parameter(Mandatory = $true)][string]$CloudflaredPath,
    [Parameter(Mandatory = $true)][string[]]$Arguments
  )

    # cloudflared writes normal INFO messages to stderr. Under the script-wide
  # ErrorActionPreference=Stop, Windows PowerShell 5.1 can promote those
  # redirected stderr records to terminating NativeCommandError exceptions
  # even when cloudflared exits successfully. Capture both streams first and
  # decide success exclusively from the native process exit code.
  $previousErrorActionPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    $output = @(& $CloudflaredPath @Arguments 2>&1)
    $exitCode = $LASTEXITCODE
  }
  finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
  return [pscustomobject]@{
    ExitCode = $exitCode
    Output   = $output
    Text     = (($output | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine).Trim()
  }
}

function Get-CloudflaredTunnelList {
  param(
    [Parameter(Mandatory = $true)]
    [string]$CloudflaredPath
  )

  $stderrFile = Join-Path $env:TEMP `
    ("cloudflared-tunnel-list-{0}.err" -f [Guid]::NewGuid())

  try {
    # Chỉ lấy stdout để parse JSON; stderr được ghi riêng.
    $stdout = & $CloudflaredPath tunnel list --output json `
      2> $stderrFile |
      Out-String

    $exitCode = $LASTEXITCODE
    $stderr = if (Test-Path $stderrFile) {
      Get-Content -LiteralPath $stderrFile -Raw -ErrorAction SilentlyContinue
    }
    else {
      ""
    }

    if ($exitCode -ne 0) {
      throw "Không đọc được danh sách Cloudflare Tunnel.`n$stderr"
    }

    $raw = $stdout.Trim()

    if ([string]::IsNullOrWhiteSpace($raw)) {
      throw "cloudflared không trả về dữ liệu JSON.`n$stderr"
    }

    try {
      $parsed = $raw | ConvertFrom-Json -ErrorAction Stop
      return @($parsed)
    }
    catch {
      throw @"
Không parse được JSON từ cloudflared tunnel list:
$($_.Exception.Message)

STDOUT:
$raw

STDERR:
$stderr
"@
    }
  }
  finally {
    Remove-Item -LiteralPath $stderrFile `
      -Force `
      -ErrorAction SilentlyContinue
  }
}

function Ensure-CloudflaredLogin {
  param(
    [Parameter(Mandatory = $true)][string]$CloudflaredPath,
    [switch]$DisablePrompt
  )

  $cloudflaredHome = Get-CloudflaredHomeDirectory
  $certificatePath = Join-Path $cloudflaredHome "cert.pem"
  if (Test-Path -LiteralPath $certificatePath -PathType Leaf) {
    return $certificatePath
  }

  if ($DisablePrompt) {
    throw "Chưa có $certificatePath. Chạy 'cloudflared tunnel login' trước hoặc bỏ -NonInteractive."
  }

  Write-Host ""
  Write-Host "  Cloudflare cần đăng nhập một lần để tạo Named Tunnel và DNS record." -ForegroundColor Yellow
  Write-Host "  Trình duyệt sẽ mở; chọn đúng tài khoản và domain đang quản lý trên Cloudflare." -ForegroundColor DarkGray
  $null = Read-Host "  Nhấn Enter để mở Cloudflare login"

  $loginResult = Invoke-CloudflaredCommand `
    -CloudflaredPath $CloudflaredPath `
    -Arguments @("tunnel", "login")

  if ($loginResult.ExitCode -ne 0 -or -not (Test-Path -LiteralPath $certificatePath -PathType Leaf)) {
    throw "Cloudflare login chưa hoàn tất hoặc không tạo được cert.pem.`n$($loginResult.Text)"
  }

  return $certificatePath
}

function ConvertTo-YamlSingleQuotedValue {
  param([Parameter(Mandatory = $true)][string]$Value)
  return "'" + $Value.Replace("'", "''") + "'"
}

function Write-CloudflaredNamedConfig {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$TunnelId,
    [Parameter(Mandatory = $true)][string]$CredentialsFile,
    [Parameter(Mandatory = $true)][string]$Hostname,
    [Parameter(Mandatory = $true)][int]$LocalPort
  )

  $tunnelValue = ConvertTo-YamlSingleQuotedValue -Value $TunnelId
  $credentialsValue = ConvertTo-YamlSingleQuotedValue -Value $CredentialsFile
  $hostnameValue = ConvertTo-YamlSingleQuotedValue -Value $Hostname
  $serviceValue = ConvertTo-YamlSingleQuotedValue -Value "http://127.0.0.1:$LocalPort"

  $content = @(
    "tunnel: $tunnelValue",
    "credentials-file: $credentialsValue",
    "ingress:",
    "  - hostname: $hostnameValue",
    "    service: $serviceValue",
    "  - service: http_status:404"
  ) -join [Environment]::NewLine

  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $content + [Environment]::NewLine, $utf8NoBom)
}

function Initialize-LocallyManagedNamedTunnel {
  param(
    [Parameter(Mandatory = $true)][string]$CloudflaredPath,
    [Parameter(Mandatory = $true)][string]$ConfigDirectory,
    [Parameter(Mandatory = $true)][string]$ProfileName,
    [Parameter(Mandatory = $true)][int]$SessionNumber,
    [Parameter(Mandatory = $true)][int]$LocalPort,
    [string]$RequestedPublicBaseUrl,
    [string]$RequestedTunnelName,
    [switch]$DisablePrompt,
    [switch]$ForceDnsOverwrite
  )

  $statePath = Join-Path $ConfigDirectory "cloudflared.named.json"
  $cloudflaredConfigPath = Join-Path $ConfigDirectory "cloudflared.named.yml"
  $saved = $null
  if (Test-Path -LiteralPath $statePath -PathType Leaf) {
    try {
      $saved = Get-Content -Raw -LiteralPath $statePath | ConvertFrom-Json
    }
    catch {
      Write-Host "  ⚠️ Bỏ qua state Named Tunnel lỗi: $statePath" -ForegroundColor Yellow
    }
  }

  $defaultTunnelName = Resolve-CloudflaredTunnelName `
    -RequestedName "" `
    -DefaultName "$ProfileName-s$SessionNumber-devspace"

  $savedTunnelName = if ($saved -and $saved.TunnelName) { [string]$saved.TunnelName } else { "" }
  $tunnelNameCandidate = if (-not [string]::IsNullOrWhiteSpace($RequestedTunnelName)) {
    $RequestedTunnelName
  }
  elseif (-not [string]::IsNullOrWhiteSpace($savedTunnelName)) {
    $savedTunnelName
  }
  else {
    $defaultTunnelName
  }

  if (-not $DisablePrompt -and -not $saved -and [string]::IsNullOrWhiteSpace($RequestedTunnelName)) {
    $tunnelNameCandidate = Read-HostWithDefault `
      -Prompt "  Tên Named Tunnel" `
      -DefaultValue $defaultTunnelName `
      -Required
  }

  $resolvedTunnelName = Resolve-CloudflaredTunnelName `
    -RequestedName $tunnelNameCandidate `
    -DefaultName $defaultTunnelName

  $savedPublicBaseUrl = if ($saved -and $saved.PublicBaseUrl) { [string]$saved.PublicBaseUrl } else { "" }
  $usingSavedPublicBaseUrl = $false
  $publicBaseUrlCandidate = if (-not [string]::IsNullOrWhiteSpace($RequestedPublicBaseUrl)) {
    $RequestedPublicBaseUrl
  }
  elseif (-not [string]::IsNullOrWhiteSpace($savedPublicBaseUrl)) {
    $usingSavedPublicBaseUrl = $true
    $savedPublicBaseUrl
  }
  else {
    ""
  }

  if ([string]::IsNullOrWhiteSpace($publicBaseUrlCandidate)) {
    if ($DisablePrompt) {
      throw "Named Tunnel chưa có hostname. Truyền -PublicBaseUrl https://devspace.example.com hoặc chạy không có -NonInteractive."
    }

    $publicBaseUrlCandidate = Read-HostWithDefault `
      -Prompt "  Public hostname đầy đủ/FQDN (ví dụ devspace.example.com)" `
      -Required
  }

  try {
    $resolvedPublicBaseUrl = Normalize-PublicBaseUrl -Value $publicBaseUrlCandidate
  }
  catch {
    if (-not $usingSavedPublicBaseUrl -or $DisablePrompt) {
      throw
    }

    Write-Host "  ⚠️ State cũ chứa PublicBaseUrl không hợp lệ: $savedPublicBaseUrl" -ForegroundColor Yellow
    Write-Host "     Hãy nhập hostname đầy đủ, ví dụ myinterviewconnector.hzi.io.vn." -ForegroundColor DarkGray
    $publicBaseUrlCandidate = Read-HostWithDefault `
      -Prompt "  Public hostname đầy đủ/FQDN" `
      -Required
    $resolvedPublicBaseUrl = Normalize-PublicBaseUrl -Value $publicBaseUrlCandidate
  }

  $hostname = ([Uri]$resolvedPublicBaseUrl).DnsSafeHost

  $null = Ensure-CloudflaredLogin `
    -CloudflaredPath $CloudflaredPath `
    -DisablePrompt:$DisablePrompt

  $tunnels = @(Get-CloudflaredTunnelList -CloudflaredPath $CloudflaredPath)
  $matches = @($tunnels | Where-Object { [string]$_.name -eq $resolvedTunnelName })
  if ($matches.Count -gt 1) {
    throw "Có nhiều Cloudflare Tunnel trùng tên '$resolvedTunnelName'. Hãy truyền -TunnelName khác hoặc dọn tunnel trùng trong Cloudflare."
  }

  $createdTunnel = $false
  if ($matches.Count -eq 0) {
    Write-Host "  Đang tạo Named Tunnel '$resolvedTunnelName'..." -ForegroundColor Gray
    $createResult = Invoke-CloudflaredCommand `
      -CloudflaredPath $CloudflaredPath `
      -Arguments @("tunnel", "create", $resolvedTunnelName)

    if ($createResult.ExitCode -ne 0) {
      throw "Tạo Named Tunnel thất bại.`n$($createResult.Text)"
    }

    $createdTunnel = $true
    $tunnels = @(Get-CloudflaredTunnelList -CloudflaredPath $CloudflaredPath)
    $matches = @($tunnels | Where-Object { [string]$_.name -eq $resolvedTunnelName })
    if ($matches.Count -ne 1) {
      throw "Đã chạy tunnel create nhưng không xác định được UUID của '$resolvedTunnelName'."
    }
  }

  $tunnel = $matches[0]
  $tunnelId = [string]$tunnel.id
  if ([string]::IsNullOrWhiteSpace($tunnelId)) {
    throw "Cloudflare Tunnel '$resolvedTunnelName' không có UUID hợp lệ trong tunnel list."
  }

  $credentialsFile = Join-Path (Get-CloudflaredHomeDirectory) "$tunnelId.json"
  if (-not (Test-Path -LiteralPath $credentialsFile -PathType Leaf)) {
    throw @"
Đã tìm thấy tunnel '$resolvedTunnelName' ($tunnelId) nhưng thiếu credentials file:
  $credentialsFile

Launcher không thể chạy locally-managed tunnel nếu file này bị mất. Hãy dùng -TunnelName khác để tạo tunnel mới,
hoặc dùng remotely-managed tunnel với -PublicBaseUrl và -TunnelTokenFile.
"@
  }

  $savedTunnelId = if ($saved -and $saved.TunnelId) { [string]$saved.TunnelId } else { "" }
  $savedHostname = if ($saved -and $saved.Hostname) { [string]$saved.Hostname } else { "" }
  $needsDnsRoute = $createdTunnel -or -not $saved -or $savedTunnelId -ne $tunnelId -or $savedHostname -ne $hostname

  if ($needsDnsRoute) {
    Write-Host "  Đang tạo DNS route '$hostname' → $resolvedTunnelName..." -ForegroundColor Gray
    $routeArguments = @("tunnel", "route", "dns", $tunnelId, $hostname)
    $routeResult = Invoke-CloudflaredCommand `
      -CloudflaredPath $CloudflaredPath `
      -Arguments $routeArguments

    if ($routeResult.ExitCode -ne 0) {
      $canOverwrite = $ForceDnsOverwrite
      if (-not $canOverwrite -and -not $DisablePrompt -and $routeResult.Text -match '(already exists|đã tồn tại|code:\s*1003)') {
        Write-Host "  DNS hostname đã có record khác:" -ForegroundColor Yellow
        Write-Host "  $($routeResult.Text)" -ForegroundColor DarkGray
        $answer = Read-Host "  Ghi đè DNS record này để trỏ vào tunnel? (y/N)"
        $canOverwrite = $answer -match '^(?i:y|yes)$'
      }

      if ($canOverwrite) {
        $routeResult = Invoke-CloudflaredCommand `
          -CloudflaredPath $CloudflaredPath `
          -Arguments @("tunnel", "route", "dns", "--overwrite-dns", $tunnelId, $hostname)
      }

      if ($routeResult.ExitCode -ne 0) {
        throw "Không tạo được DNS route cho '$hostname'.`n$($routeResult.Text)"
      }
    }
  }

  Write-CloudflaredNamedConfig `
    -Path $cloudflaredConfigPath `
    -TunnelId $tunnelId `
    -CredentialsFile $credentialsFile `
    -Hostname $hostname `
    -LocalPort $LocalPort

  $state = [ordered]@{
    Version                 = 1
    Mode                    = "local-managed"
    TunnelName              = $resolvedTunnelName
    TunnelId                = $tunnelId
    PublicBaseUrl           = $resolvedPublicBaseUrl
    Hostname                = $hostname
    CredentialsFile         = $credentialsFile
    CloudflaredConfigPath   = $cloudflaredConfigPath
    UpdatedAtUtc            = [DateTime]::UtcNow.ToString("o")
  }
  Write-Utf8NoBomJson -Path $statePath -Value $state

  return [pscustomobject]@{
    Mode                    = "named"
    Kind                    = "local-managed"
    PublicBaseUrl           = $resolvedPublicBaseUrl
    TokenFile               = $null
    TunnelName              = $resolvedTunnelName
    TunnelId                = $tunnelId
    CredentialsFile         = $credentialsFile
    CloudflaredConfigPath   = $cloudflaredConfigPath
    StatePath               = $statePath
  }
}

function Resolve-TunnelConfiguration {
  param(
    [Parameter(Mandatory = $true)][string]$RequestedMode,
    [string]$RequestedPublicBaseUrl,
    [string]$RequestedTokenFile,
    [string]$RequestedTunnelName,
    [Parameter(Mandatory = $true)][string]$CloudflaredPath,
    [Parameter(Mandatory = $true)][string]$ConfigDirectory,
    [Parameter(Mandatory = $true)][string]$ProfileName,
    [Parameter(Mandatory = $true)][int]$SessionNumber,
    [Parameter(Mandatory = $true)][int]$LocalPort,
    [switch]$DisablePrompt,
    [switch]$ForceDnsOverwrite
  )

  $hasPublicUrl = -not [string]::IsNullOrWhiteSpace($RequestedPublicBaseUrl)
  $hasTokenFile = -not [string]::IsNullOrWhiteSpace($RequestedTokenFile)
  $hasTunnelName = -not [string]::IsNullOrWhiteSpace($RequestedTunnelName)
  $savedNamedState = Test-Path -LiteralPath (Join-Path $ConfigDirectory "cloudflared.named.json") -PathType Leaf

  $resolvedMode = $RequestedMode
  if ($RequestedMode -eq "auto") {
    if ($hasPublicUrl -or $hasTokenFile -or $hasTunnelName -or $savedNamedState) {
      $resolvedMode = "named"
    }
    else {
      $resolvedMode = "quick"
    }
  }

  if ($resolvedMode -eq "quick") {
    if ($hasPublicUrl -or $hasTokenFile -or $hasTunnelName) {
      throw "Quick Tunnel không dùng -PublicBaseUrl, -TunnelTokenFile hoặc -TunnelName. Hãy bỏ chúng hoặc dùng -TunnelMode named."
    }

    return [pscustomobject]@{
      Mode                    = "quick"
      Kind                    = "quick"
      PublicBaseUrl           = $null
      TokenFile               = $null
      TunnelName              = $null
      TunnelId                = $null
      CredentialsFile         = $null
      CloudflaredConfigPath   = $null
      StatePath               = $null
    }
  }

  if ($hasTokenFile) {
    if (-not $hasPublicUrl) {
      if ($DisablePrompt) {
        throw "Remotely-managed Named Tunnel cần -PublicBaseUrl khi dùng -TunnelTokenFile."
      }

      $RequestedPublicBaseUrl = Read-HostWithDefault `
        -Prompt "  Public hostname của Named Tunnel token này" `
        -Required
    }

    if (-not (Test-Path -LiteralPath $RequestedTokenFile -PathType Leaf)) {
      throw "Không tìm thấy Cloudflare tunnel token file: $RequestedTokenFile"
    }

    $tokenFilePath = (Resolve-Path -LiteralPath $RequestedTokenFile).Path
    $tokenContent = (Get-Content -Raw -LiteralPath $tokenFilePath).Trim()
    if ([string]::IsNullOrWhiteSpace($tokenContent) -or $tokenContent.Length -lt 32) {
      throw "Cloudflare tunnel token file trống hoặc không hợp lệ: $tokenFilePath"
    }

    return [pscustomobject]@{
      Mode                    = "named"
      Kind                    = "remote-token"
      PublicBaseUrl           = Normalize-PublicBaseUrl -Value $RequestedPublicBaseUrl
      TokenFile               = $tokenFilePath
      TunnelName              = $null
      TunnelId                = $null
      CredentialsFile         = $null
      CloudflaredConfigPath   = $null
      StatePath               = $null
    }
  }

  return Initialize-LocallyManagedNamedTunnel `
    -CloudflaredPath $CloudflaredPath `
    -ConfigDirectory $ConfigDirectory `
    -ProfileName $ProfileName `
    -SessionNumber $SessionNumber `
    -LocalPort $LocalPort `
    -RequestedPublicBaseUrl $RequestedPublicBaseUrl `
    -RequestedTunnelName $RequestedTunnelName `
    -DisablePrompt:$DisablePrompt `
    -ForceDnsOverwrite:$ForceDnsOverwrite
}

function Assert-QuickTunnelCompatibility {
  $configDirectory = Join-Path $env:USERPROFILE ".cloudflared"
  $conflictingConfigs = @(
    @(
      Join-Path $configDirectory "config.yml"
      Join-Path $configDirectory "config.yaml"
    ) | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf }
  )

  if ($conflictingConfigs.Count -gt 0) {
    throw @"
Cloudflare Quick Tunnel cannot start while a default cloudflared config file is present:
  $($conflictingConfigs -join ([Environment]::NewLine + '  '))

Use a Named Tunnel instead:
  -TunnelMode named -PublicBaseUrl https://your-host.example.com -TunnelTokenFile C:\path\to\token.txt

The launcher will not rename or modify your existing Cloudflare configuration automatically.
"@
  }
}

function Wait-ForHttpEndpoint {
  param(
    [Parameter(Mandatory = $true)][string]$Uri,
    [int]$TimeoutSeconds = 30,
    [System.Diagnostics.Process]$RequiredProcess = $null
  )

  $watch = [Diagnostics.Stopwatch]::StartNew()
  $lastError = $null

  while ($watch.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
    if ($RequiredProcess -and $RequiredProcess.HasExited) {
      return [pscustomobject]@{
        Success = $false
        Error   = "Required process exited with code $($RequiredProcess.ExitCode)."
      }
    }

    try {
      $null = Invoke-RestMethod `
        -Uri $Uri `
        -Method Get `
        -TimeoutSec 8 `
        -ErrorAction Stop

      return [pscustomobject]@{
        Success = $true
        Error   = $null
      }
    }
    catch {
      $lastError = $_.Exception.Message
    }

    Start-Sleep -Milliseconds 750
  }

  return [pscustomobject]@{
    Success = $false
    Error   = $lastError
  }
}

function Write-Utf8NoBomJson {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)]$Value
  )

  $json = $Value | ConvertTo-Json -Depth 20
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText(
    $Path,
    $json + [Environment]::NewLine,
    $utf8NoBom
  )
}

function ConvertTo-OrderedMap {
  param($Object)

  $map = [ordered]@{}
  if ($null -eq $Object) {
    return $map
  }

  foreach ($property in $Object.PSObject.Properties) {
    $map[$property.Name] = $property.Value
  }

  return $map
}

function New-OwnerToken {
  $bytes = New-Object byte[] 32
  $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $random.GetBytes($bytes)
  }
  finally {
    $random.Dispose()
  }

  $token = [Convert]::ToBase64String($bytes)
  $token = $token.TrimEnd([char]"=")
  $token = $token.Replace("+", "-")
  $token = $token.Replace("/", "_")
  return $token
}

function Ensure-GitBash {
  $candidates = @(
    (Join-Path $env:ProgramFiles "Git\bin\bash.exe"),
    (Join-Path $env:ProgramFiles "Git\usr\bin\bash.exe"),
    (Join-Path $env:LOCALAPPDATA "Programs\Git\bin\bash.exe")
  )

  if (${env:ProgramFiles(x86)}) {
    $candidates += Join-Path ${env:ProgramFiles(x86)} "Git\bin\bash.exe"
  }

  $candidates += Get-ExecutablePath -Names @("bash.exe", "bash")

  $bashPath = $candidates |
  Where-Object { $_ -and (Test-Path $_) } |
  Select-Object -First 1

  if (-not $bashPath) {
    throw @"
Không tìm thấy Git Bash.

Cài Git for Windows rồi chạy lại:
  winget install --id Git.Git --exact --accept-package-agreements --accept-source-agreements
"@
  }

  $bashDirectory = Split-Path -Parent $bashPath
  $gitRoot = Split-Path -Parent $bashDirectory
  $gitCmdDirectory = Join-Path $gitRoot "cmd"

  foreach ($directory in @($bashDirectory, $gitCmdDirectory)) {
    if ((Test-Path $directory) -and (($env:PATH -split ";") -notcontains $directory)) {
      $env:PATH = "$directory;$env:PATH"
    }
  }

  $gitPath = Get-ExecutablePath -Names @("git.exe", "git")
  if (-not $gitPath) {
    throw "Đã tìm thấy Git Bash nhưng không tìm thấy git.exe."
  }

  return $bashPath
}

function Assert-NodeVersion {
  $nodePath = Get-ExecutablePath -Names @("node.exe", "node")
  if (-not $nodePath) {
    throw "Không tìm thấy Node.js. DevSpace yêu cầu Node >=22.19 và <27."
  }

  $rawVersion = (& $nodePath --version 2>&1 | Select-Object -First 1).ToString().Trim()
  $normalized = ($rawVersion.TrimStart([char]"v") -split "-")[0]

  try {
    $version = [version]$normalized
  }
  catch {
    throw "Không đọc được phiên bản Node.js: $rawVersion"
  }

  if ($version -lt [version]"22.19.0" -or $version -ge [version]"27.0.0") {
    throw "Node $rawVersion không được hỗ trợ. Hãy dùng Node >=22.19 và <27."
  }

  return "$nodePath ($rawVersion)"
}

function Ensure-DevSpaceCli {
  $devspacePath = Get-ExecutablePath -Names @("devspace.cmd", "devspace.exe")
  if ($devspacePath) {
    return $devspacePath
  }

  $npmPath = Get-ExecutablePath -Names @("npm.cmd", "npm")
  if (-not $npmPath) {
    throw "Không tìm thấy npm."
  }

  if (-not $InstallMissing) {
    throw "Chưa cài DevSpace CLI. Chạy lại với -InstallMissing hoặc tự chạy: npm install -g @waishnav/devspace"
  }

  Write-Host "  DevSpace CLI chưa có, đang cài package chính thức..." -ForegroundColor Gray
  & $npmPath install -g "@waishnav/devspace"
  if ($LASTEXITCODE -ne 0) {
    throw "Cài @waishnav/devspace thất bại (exit code $LASTEXITCODE)."
  }

  $devspacePath = Get-ExecutablePath -Names @("devspace.cmd", "devspace.exe")
  if (-not $devspacePath) {
    $globalPrefix = (& $npmPath prefix -g 2>$null | Select-Object -First 1).ToString().Trim()
    $candidate = Join-Path $globalPrefix "devspace.cmd"
    if (Test-Path $candidate) {
      $devspacePath = $candidate
    }
  }

  if (-not $devspacePath) {
    throw "Đã cài package nhưng không tìm thấy devspace.cmd trong PATH."
  }

  return $devspacePath
}

function Ensure-Cloudflared {
  $cloudflaredPath = Get-ExecutablePath -Names @(
    "cloudflared.exe",
    "cloudflared",
    "cloudflared-windows-amd64.exe"
  )

  if ($cloudflaredPath) {
    return $cloudflaredPath
  }

  if (-not $InstallMissing) {
    throw "Không tìm thấy cloudflared. Chạy lại với -InstallMissing hoặc tự cài: winget install --id Cloudflare.cloudflared --exact"
  }

  $wingetPath = Get-ExecutablePath -Names @("winget.exe", "winget")
  if (-not $wingetPath) {
    throw "Không tìm thấy cloudflared hoặc winget. Hãy cài cloudflared thủ công."
  }

  Write-Host "  cloudflared chưa có, đang cài bằng winget..." -ForegroundColor Gray
  & $wingetPath install `
    --id "Cloudflare.cloudflared" `
    --exact `
    --silent `
    --accept-package-agreements `
    --accept-source-agreements

  if ($LASTEXITCODE -ne 0) {
    throw "Cài cloudflared thất bại (exit code $LASTEXITCODE)."
  }

  $winGetLinks = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Links"
  if (($env:PATH -split ";") -notcontains $winGetLinks) {
    $env:PATH = "$winGetLinks;$env:PATH"
  }

  $cloudflaredPath = Get-ExecutablePath -Names @("cloudflared.exe", "cloudflared")
  if (-not $cloudflaredPath) {
    $candidate = Join-Path $winGetLinks "cloudflared.exe"
    if (Test-Path $candidate) {
      $cloudflaredPath = $candidate
    }
  }

  if (-not $cloudflaredPath) {
    throw "cloudflared đã được cài nhưng chưa tìm thấy executable. Mở terminal mới rồi chạy lại."
  }

  return $cloudflaredPath
}

function Update-DevSpaceFiles {
  param(
    [Parameter(Mandatory = $true)][string]$RepositoryPath,
    [Parameter(Mandatory = $true)][int]$LocalPort,
    [Parameter(Mandatory = $true)][string]$ResolvedPublicBaseUrl,
    [Parameter(Mandatory = $true)][string]$ConfigDirectory
  )

  $configPath = Join-Path $ConfigDirectory "config.json"
  $authPath = Join-Path $ConfigDirectory "auth.json"

  New-Item -ItemType Directory -Path $ConfigDirectory -Force | Out-Null

  $existingConfig = $null
  if (Test-Path $configPath) {
    try {
      $existingConfig = Get-Content -Raw $configPath | ConvertFrom-Json
    }
    catch {
      throw "Không đọc được $configPath. Hãy sửa/xóa JSON lỗi rồi chạy lại. Chi tiết: $($_.Exception.Message)"
    }
  }

  $config = ConvertTo-OrderedMap -Object $existingConfig
  $config["host"] = "127.0.0.1"
  $config["port"] = $LocalPort

  # A profile/session belongs to one repository. Do not carry allowed roots
  # from a previous project into this isolated instance.
  $config["allowedRoots"] = @($RepositoryPath)
  $config["publicBaseUrl"] = $ResolvedPublicBaseUrl
  Write-Utf8NoBomJson -Path $configPath -Value $config

  $existingAuth = $null
  if (Test-Path $authPath) {
    try {
      $existingAuth = Get-Content -Raw $authPath | ConvertFrom-Json
    }
    catch {
      throw "Không đọc được $authPath. Hãy sửa/xóa JSON lỗi rồi chạy lại. Chi tiết: $($_.Exception.Message)"
    }
  }

  $auth = ConvertTo-OrderedMap -Object $existingAuth
  $ownerToken = [string]($auth["ownerToken"])
  if ([string]::IsNullOrWhiteSpace($ownerToken) -or $ownerToken.Length -lt 16) {
    $ownerToken = New-OwnerToken
    $auth["ownerToken"] = $ownerToken
  }
  Write-Utf8NoBomJson -Path $authPath -Value $auth

  return [pscustomobject]@{
    ConfigPath = $configPath
    AuthPath   = $authPath
    OwnerToken = $ownerToken
  }
}

function Show-LogTail {
  param(
    [string]$Title,
    [string]$Path,
    [int]$Lines = 25
  )

  if (-not [string]::IsNullOrWhiteSpace($Path) -and (Test-Path $Path)) {
    Write-Host ""
    Write-Host $Title -ForegroundColor DarkYellow
    Get-Content $Path -Tail $Lines -ErrorAction SilentlyContinue |
    ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
  }
}

function Show-CloudflaredLogs {
  Show-LogTail -Title "cloudflared log:" -Path $script:CloudflaredLog
  Show-LogTail -Title "cloudflared stdout:" -Path $script:CloudflaredStdoutLog
  Show-LogTail -Title "cloudflared stderr:" -Path $script:CloudflaredErrorLog
}

function Stop-All {
  Write-Host ""
  $instanceLabel = if ([string]::IsNullOrWhiteSpace($script:InstanceName)) { "" } else { " [$($script:InstanceName)]" }
  Write-Host "Dừng DevSpace/cloudflared$instanceLabel..." -ForegroundColor Yellow

  if ($script:DevSpaceProcess -and -not $script:DevSpaceProcess.HasExited) {
    Stop-Process -Id $script:DevSpaceProcess.Id -Force -ErrorAction SilentlyContinue
  }

  if ($script:CloudflaredProcess -and -not $script:CloudflaredProcess.HasExited) {
    Stop-Process -Id $script:CloudflaredProcess.Id -Force -ErrorAction SilentlyContinue
  }

  Write-Host "✅ Đã dừng." -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  DevSpace MCP Tunnel Launcher (cloudflared + OAuth)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$totalSteps = 7

try {
  Write-Step 1 $totalSteps "Kiểm tra repository và dependency..." Green

  if (-not (Test-Path -LiteralPath $Repo -PathType Container)) {
    throw "Không tìm thấy repository: $Repo"
  }

  $repositoryPath = (Resolve-Path -LiteralPath $Repo).Path
  $resolvedProfile = Resolve-ProfileName `
    -RequestedProfile $ProfileName `
    -RepositoryPath $repositoryPath

  $Port = Resolve-SessionPort -RequestedPort $Port -SessionNumber $Session

  $instancePaths = Initialize-InstancePaths `
    -ProfileName $resolvedProfile `
    -SessionNumber $Session

  if ($ResetNamedTunnelState) {
    $namedStatePath = Join-Path $instancePaths.ConfigDirectory "cloudflared.named.json"
    $namedConfigPath = Join-Path $instancePaths.ConfigDirectory "cloudflared.named.yml"
    Remove-Item -LiteralPath $namedStatePath -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $namedConfigPath -Force -ErrorAction SilentlyContinue
    Write-Host "  ✅ Đã reset local Named Tunnel state cho $($instancePaths.Name)." -ForegroundColor Green
    Write-Host "     Cloudflare Tunnel và DNS record trên tài khoản không bị xóa." -ForegroundColor DarkGray
  }

  # Clear only this instance's logs. Other concurrent sessions keep running
  # with their own independent files and processes.
  foreach ($logPath in @(
      $script:CloudflaredLog,
      $script:CloudflaredStdoutLog,
      $script:CloudflaredErrorLog,
      $script:DevSpaceLog,
      $script:DevSpaceErrorLog
    )) {
    Remove-Item $logPath -Force -ErrorAction SilentlyContinue
  }

  $nodeInfo = Assert-NodeVersion
  $bashPath = Ensure-GitBash
  $devspacePath = Ensure-DevSpaceCli
  $cloudflaredPath = Ensure-Cloudflared
  $cloudflaredVersion = (& $cloudflaredPath version 2>&1 | Select-Object -First 1).ToString().Trim()

  $tunnelConfiguration = Resolve-TunnelConfiguration `
    -RequestedMode $TunnelMode `
    -RequestedPublicBaseUrl $PublicBaseUrl `
    -RequestedTokenFile $TunnelTokenFile `
    -RequestedTunnelName $TunnelName `
    -CloudflaredPath $cloudflaredPath `
    -ConfigDirectory $instancePaths.ConfigDirectory `
    -ProfileName $resolvedProfile `
    -SessionNumber $Session `
    -LocalPort $Port `
    -DisablePrompt:$NonInteractive `
    -ForceDnsOverwrite:$OverwriteDns

  if ($tunnelConfiguration.Mode -eq "quick") {
    Assert-QuickTunnelCompatibility
  }

  Write-Host "  ✅ Repo:        $repositoryPath" -ForegroundColor Green
  Write-Host "  ✅ Node:        $nodeInfo" -ForegroundColor Green
  Write-Host "  ✅ Git Bash:    $bashPath" -ForegroundColor Green
  Write-Host "  ✅ DevSpace:    $devspacePath" -ForegroundColor Green
  Write-Host "  ✅ cloudflared: $cloudflaredPath" -ForegroundColor Green
  Write-Host "  ✅ Version:     $cloudflaredVersion" -ForegroundColor Green
  Write-Host "  ✅ Instance:    $($instancePaths.Name)" -ForegroundColor Green
  Write-Host "  ✅ Profile:     tools=$ToolMode, widgets=$Widgets" -ForegroundColor Green
  Write-Host "  ✅ Config dir:  $($instancePaths.ConfigDirectory)" -ForegroundColor Green
  Write-Host "  ✅ Tunnel mode: $($tunnelConfiguration.Mode) / $($tunnelConfiguration.Kind)" -ForegroundColor Green
  if ($tunnelConfiguration.Kind -eq "local-managed") {
    Write-Host "  ✅ Tunnel:      $($tunnelConfiguration.TunnelName) ($($tunnelConfiguration.TunnelId))" -ForegroundColor Green
    Write-Host "  ✅ Hostname:    $($tunnelConfiguration.PublicBaseUrl)" -ForegroundColor Green
  }

  Write-Step 2 $totalSteps "Kiểm tra port DevSpace $Port..." Yellow

  Ensure-PortAvailable -LocalPort $Port -Force:$ForcePortCleanup

  Write-Host "  ✅ Port $Port đã sẵn sàng." -ForegroundColor Green

  Write-Step 3 $totalSteps "Khởi động Cloudflare Tunnel → http://127.0.0.1:$Port..." Green

  $cloudflaredArguments = @("tunnel")

  if ($tunnelConfiguration.Kind -eq "local-managed") {
    $cloudflaredArguments += @(
      "--config", (Quote-NativeArgument -Value $tunnelConfiguration.CloudflaredConfigPath)
    )
  }

  $cloudflaredArguments += @(
    "--loglevel", "info",
    "--metrics", "localhost:0",
    "--logfile", (Quote-NativeArgument -Value $script:CloudflaredLog)
  )

  if ($tunnelConfiguration.Mode -eq "quick") {
    $cloudflaredArguments += @(
      "--url", "http://127.0.0.1:$Port"
    )
  }
  elseif ($tunnelConfiguration.Kind -eq "remote-token") {
    $cloudflaredArguments += @(
      "run",
      "--token-file", (Quote-NativeArgument -Value $tunnelConfiguration.TokenFile)
    )
  }
  else {
    $cloudflaredArguments += @(
      "run",
      $tunnelConfiguration.TunnelId
    )
  }

  $script:CloudflaredProcess = Start-Process `
    -FilePath $cloudflaredPath `
    -ArgumentList $cloudflaredArguments `
    -NoNewWindow `
    -PassThru `
    -RedirectStandardOutput $script:CloudflaredStdoutLog `
    -RedirectStandardError $script:CloudflaredErrorLog

  if ($tunnelConfiguration.Mode -eq "quick") {
    $tunnelUrl = Get-CloudflaredPublicUrl -TimeoutSeconds 45
    if (-not $tunnelUrl) {
      Show-CloudflaredLogs
      throw @"
Không lấy được Cloudflare Quick Tunnel HTTPS URL.

Kiểm tra firewall/VPN/WARP và kết nối outbound tới Cloudflare. Nếu muốn URL ổn định,
chạy lại với -TunnelMode named; launcher sẽ hỏi hostname và tự tạo tunnel nếu cần.
"@
    }
  }
  else {
    Start-Sleep -Seconds 3
    if ($script:CloudflaredProcess.HasExited) {
      Show-CloudflaredLogs
      throw "cloudflared Named Tunnel đã dừng với exit code $($script:CloudflaredProcess.ExitCode)."
    }

    $tunnelUrl = $tunnelConfiguration.PublicBaseUrl
  }

  $mcpEndpoint = "$tunnelUrl/mcp"
  Write-Host "  ✅ Tunnel: $tunnelUrl" -ForegroundColor Cyan

  Write-Step 4 $totalSteps "Tạo/cập nhật cấu hình DevSpace..." Green

  $devspaceFiles = Update-DevSpaceFiles `
    -RepositoryPath $repositoryPath `
    -LocalPort $Port `
    -ResolvedPublicBaseUrl $tunnelUrl `
    -ConfigDirectory $instancePaths.ConfigDirectory

  $env:HOST = "127.0.0.1"
  $env:PORT = [string]$Port
  $env:DEVSPACE_CONFIG_DIR = $instancePaths.ConfigDirectory
  $env:DEVSPACE_STATE_DIR = $instancePaths.StateDirectory
  $env:DEVSPACE_WORKTREE_ROOT = $instancePaths.WorktreeDirectory
  $env:DEVSPACE_ALLOWED_ROOTS = $repositoryPath
  $env:DEVSPACE_PUBLIC_BASE_URL = $tunnelUrl
  $env:DEVSPACE_TOOL_MODE = $ToolMode
  $env:DEVSPACE_WIDGETS = $Widgets
  $env:DEVSPACE_SKILLS = "1"
  $env:DEVSPACE_LOG_FORMAT = "pretty"
  $env:DEVSPACE_LOG_REQUESTS = "1"
  $env:DEVSPACE_LOG_TOOL_CALLS = "1"
  $env:DEVSPACE_LOG_SHELL_COMMANDS = "0"

  Write-Host "  ✅ Config: $($devspaceFiles.ConfigPath)" -ForegroundColor Green
  Write-Host "  ✅ Auth:   $($devspaceFiles.AuthPath)" -ForegroundColor Green
  Write-Host "  ✅ State:  $($instancePaths.StateDirectory)" -ForegroundColor Green
  Write-Host "  ✅ Mode:   tools=$ToolMode, widgets=$Widgets, skills=on" -ForegroundColor Green

  Write-Step 5 $totalSteps "Chạy DevSpace doctor..." Green

  $doctorOutput = & $devspacePath doctor 2>&1
  $doctorExitCode = $LASTEXITCODE
  $doctorOutput | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }

  if ($doctorExitCode -ne 0) {
    throw "devspace doctor thất bại (exit code $doctorExitCode)."
  }

  Write-Step 6 $totalSteps "Khởi động DevSpace MCP server..." Green

  $script:DevSpaceProcess = Start-Process `
    -FilePath $devspacePath `
    -ArgumentList @("serve") `
    -NoNewWindow `
    -PassThru `
    -RedirectStandardOutput $script:DevSpaceLog `
    -RedirectStandardError $script:DevSpaceErrorLog

  if (-not (Wait-ForTcpPort -LocalPort $Port -Process $script:DevSpaceProcess -TimeoutSeconds 30)) {
    Show-LogTail -Title "DevSpace stdout:" -Path $script:DevSpaceLog
    Show-LogTail -Title "DevSpace stderr:" -Path $script:DevSpaceErrorLog
    throw "DevSpace không mở được port $Port."
  }

  Write-Host "  ✅ DevSpace PID $($script:DevSpaceProcess.Id) trên port $Port." -ForegroundColor Green

  Write-Step 7 $totalSteps "Verify OAuth metadata và tunnel..." Green

  $localMetadataUrl = "http://127.0.0.1:$Port/.well-known/oauth-protected-resource/mcp"
  $publicMetadataUrl = "$tunnelUrl/.well-known/oauth-protected-resource/mcp"

  $localVerification = Wait-ForHttpEndpoint `
    -Uri $localMetadataUrl `
    -TimeoutSeconds 20 `
    -RequiredProcess $script:DevSpaceProcess

  if ($localVerification.Success) {
    Write-Host "  ✅ Local OAuth metadata OK." -ForegroundColor Green
  }
  else {
    Write-Host "  ⚠️ Local OAuth metadata chưa verify được: $($localVerification.Error)" -ForegroundColor Yellow
  }

  $publicVerification = Wait-ForHttpEndpoint `
    -Uri $publicMetadataUrl `
    -TimeoutSeconds 35 `
    -RequiredProcess $script:CloudflaredProcess

  if ($publicVerification.Success) {
    Write-Host "  ✅ Public tunnel OAuth metadata OK." -ForegroundColor Green
  }
  else {
    Write-Host "  ⚠️ Public metadata chưa verify được: $($publicVerification.Error)" -ForegroundColor Yellow
    Write-Host "     Xem cloudflared và DevSpace logs bên dưới nếu connector không kết nối được." -ForegroundColor DarkGray
  }

  if (-not $NoClipboard) {
    $setClipboard = Get-Command Set-Clipboard -ErrorAction SilentlyContinue
    if ($setClipboard) {
      Set-Clipboard -Value $mcpEndpoint
      Write-Host "  ✅ Đã copy MCP URL vào clipboard." -ForegroundColor Green
    }
  }

  Write-Host ""
  Write-Host "============================================================" -ForegroundColor Cyan
  Write-Host "  ✅ DevSpace đã sẵn sàng!" -ForegroundColor Green
  Write-Host "  [$($instancePaths.Name) | ChatGPT → Cloudflare Tunnel → DevSpace:$Port]" -ForegroundColor DarkGray
  Write-Host "============================================================" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "  1) ChatGPT Custom App / Connector URL:" -ForegroundColor Yellow
  Write-Host "     $mcpEndpoint" -ForegroundColor White
  Write-Host ""
  Write-Host "  2) Owner password khi OAuth yêu cầu:" -ForegroundColor Yellow
  if ($ShowOwnerToken) {
    Write-Host "     $($devspaceFiles.OwnerToken)" -ForegroundColor Magenta
  }
  else {
    Write-Host "     Đã ẩn khỏi terminal; dùng -ShowOwnerToken khi thực sự cần hiển thị." -ForegroundColor DarkGray
    Write-Host "     Token được lưu tại $($devspaceFiles.AuthPath)." -ForegroundColor DarkGray
  }
  Write-Host ""
  Write-Host "  3) Isolated instance:" -ForegroundColor Yellow
  Write-Host "     Profile=$resolvedProfile | Session=$Session | Port=$Port" -ForegroundColor White
  Write-Host "     Config=$($instancePaths.ConfigDirectory)" -ForegroundColor DarkGray
  Write-Host ""
  Write-Host "  4) Allowed repository:" -ForegroundColor Yellow
  Write-Host "     $repositoryPath" -ForegroundColor White
  Write-Host ""
  Write-Host "  5) Coding profile:" -ForegroundColor Yellow
  Write-Host "     ToolMode=$ToolMode | Widgets=$Widgets | Skills=on" -ForegroundColor White
  Write-Host ""
  Write-Host "  6) Tunnel mode:" -ForegroundColor Yellow
  Write-Host "     $($tunnelConfiguration.Mode) / $($tunnelConfiguration.Kind)" -ForegroundColor White
  if ($tunnelConfiguration.Kind -eq "local-managed") {
    Write-Host "     Name=$($tunnelConfiguration.TunnelName) | ID=$($tunnelConfiguration.TunnelId)" -ForegroundColor DarkGray
    Write-Host "     Cloudflared config=$($tunnelConfiguration.CloudflaredConfigPath)" -ForegroundColor DarkGray
    Write-Host "     Saved state=$($tunnelConfiguration.StatePath)" -ForegroundColor DarkGray
  }
  Write-Host ""
  Write-Host "  7) Local MCP:" -ForegroundColor DarkGray
  Write-Host "     http://127.0.0.1:$Port/mcp" -ForegroundColor DarkGray
  Write-Host "  8) Logs:" -ForegroundColor DarkGray
  Write-Host "     $($instancePaths.LogDirectory)" -ForegroundColor DarkGray
  Write-Host "     $($script:CloudflaredLog)" -ForegroundColor DarkGray
  Write-Host "     $($script:CloudflaredErrorLog)" -ForegroundColor DarkGray
  Write-Host "     $($script:DevSpaceLog)" -ForegroundColor DarkGray
  Write-Host "     $($script:DevSpaceErrorLog)" -ForegroundColor DarkGray
  Write-Host ""

  if ($tunnelConfiguration.Mode -eq "quick") {
    Write-Host "  Quick Tunnel URL đổi sau mỗi restart và chỉ phù hợp dev/test." -ForegroundColor Yellow
    Write-Host "  Cloudflare ghi rõ Quick Tunnel không hỗ trợ SSE; dùng Named Tunnel nếu connector cần kết nối ổn định." -ForegroundColor Yellow
  }
  else {
    Write-Host "  Named Tunnel đang dùng hostname ổn định: $tunnelUrl" -ForegroundColor Green
  }

  Write-Host "  Không chạy script bằng Administrator. Nhấn Ctrl+C để dừng." -ForegroundColor DarkGray
  Write-Host "============================================================" -ForegroundColor Cyan
  Write-Host ""

  while ($true) {
    if ($script:DevSpaceProcess.HasExited) {
      Show-LogTail -Title "DevSpace stdout:" -Path $script:DevSpaceLog
      Show-LogTail -Title "DevSpace stderr:" -Path $script:DevSpaceErrorLog
      throw "DevSpace đã dừng với exit code $($script:DevSpaceProcess.ExitCode)."
    }

    if ($script:CloudflaredProcess.HasExited) {
      Show-CloudflaredLogs
      throw "cloudflared đã dừng với exit code $($script:CloudflaredProcess.ExitCode)."
    }

    Start-Sleep -Seconds 1
  }
}
catch [System.Management.Automation.PipelineStoppedException] {
  # Ctrl+C
}
catch {
  Write-Host ""
  Write-Host "❌ $($_.Exception.Message)" -ForegroundColor Red
  Show-LogTail -Title "DevSpace stderr gần nhất:" -Path $script:DevSpaceErrorLog -Lines 20
  Show-LogTail -Title "cloudflared stderr gần nhất:" -Path $script:CloudflaredErrorLog -Lines 20
  exit 1
}
finally {
  Stop-All
}
