param([switch]$Check)
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$root = Join-Path $repo 'runtime_templates'
$drift = @()
Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.tmpl' | ForEach-Object {
  $rel = $_.FullName.Substring($root.Length + 1)
  $target = Join-Path $repo $rel.Substring(0, $rel.Length - 5)
  if (-not (Test-Path -LiteralPath $target)) { return }
  $prefix = [Text.Encoding]::UTF8.GetString([IO.File]::ReadAllBytes($target)[0..([Math]::Min(15,(Get-Item $target).Length-1))])
  if ($prefix.StartsWith('%TSD-Header-###%')) { return }
  $same = (Get-FileHash -LiteralPath $_.FullName).Hash -eq (Get-FileHash -LiteralPath $target).Hash
  if (-not $same) { $drift += $rel; if (-not $Check) { Copy-Item -LiteralPath $_.FullName -Destination $target -Force } }
}
if ($Check -and $drift.Count) { Write-Error ("Template drift detected:`n" + ($drift -join "`n")); exit 1 }
Write-Output ($(if ($drift.Count) { "Synchronized $($drift.Count) files." } else { 'runtime_templates and local source are synchronized.' }))
