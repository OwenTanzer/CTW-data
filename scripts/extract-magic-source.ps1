param([string]$Output = "work/magic-source")
$mutex = [System.Threading.Mutex]::new($false, "Local\ComputationalTotalWarRpfmResearch")
$acquired = $false
try {
    try { $acquired = $mutex.WaitOne(0) }
    catch [System.Threading.AbandonedMutexException] { $acquired = $true }
    if (-not $acquired) { throw "RPFM research lock is busy. Retry when the active extraction finishes." }
    & node (Join-Path $PSScriptRoot "extract-magic-source.mjs") $Output
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
    if ($acquired) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
