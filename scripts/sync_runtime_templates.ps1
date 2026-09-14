param([switch]$Check, [switch]$Sync)
$ErrorActionPreference = 'Stop'
if ($Check -and $Sync) { throw 'Use either -Check or -Sync.' }
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$root = Join-Path $repo 'runtime_templates'
$utf8 = New-Object Text.UTF8Encoding($false, $true)
$rg = (Get-Command rg -ErrorAction Stop).Source
$drift = @()
Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.tmpl' | ForEach-Object {
  $rel = $_.FullName.Substring($root.Length + 1)
  $relative = $rel.Substring(0, $rel.Length - 5)
  $source = Join-Path $repo $relative
  if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "Missing local source: $relative" }
  $bytes = [IO.File]::ReadAllBytes($source)
  if ($bytes.Length -eq 0) { $text = '' }
  else {
    # rg is the authorized plaintext reader for transparent-encrypted files;
    # inspect its result before looking at ciphertext bytes.
    $lines = @(& $rg --text --no-heading --no-line-number --no-filename '^' -- $source)
    $readerExit = $LASTEXITCODE
    if ($readerExit -gt 1) {
      $head = [Text.Encoding]::UTF8.GetString($bytes[0..([Math]::Min(63,$bytes.Length-1))])
      if ($head.Contains('%TSD-Header-###%')) { throw "Unreadable encrypted source: $relative" }
      throw "Source reader failed ($readerExit): $relative"
    }
    if ($readerExit -eq 1) { throw "Source reader returned no readable text: $relative" }
    $text = (($lines -join "`n").TrimStart([char]0xFEFF))
    if ($text.Length -and -not $text.EndsWith("`n")) { $text += "`n" }
  }
  $existing = [IO.File]::ReadAllText($_.FullName, $utf8).Replace("`r`n", "`n").Replace("`r", "`n")
  $text = $text.Replace("`r`n", "`n").Replace("`r", "`n")
  if ($existing.TrimEnd("`n") -cne $text.TrimEnd("`n")) { $drift += $relative; if ($Sync) { [IO.File]::WriteAllText($_.FullName, $text, $utf8) } }
}
if ($drift.Count -and $Check) { throw "runtime_templates drift detected:`n$($drift -join "`n")" }
Write-Output ($(if ($drift.Count) { "Synchronized $($drift.Count) files." } else { "runtime_templates match." }))
