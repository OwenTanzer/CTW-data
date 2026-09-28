param([Parameter(Mandatory=$true)][string]$Kind, [Parameter(Mandatory=$true)][string]$Output, [string]$RequestFile = "")
$mutex = [System.Threading.Mutex]::new($false, "Local\ComputationalTotalWarRpfmResearch")
$acquired = $false
try {
    try { $acquired = $mutex.WaitOne(0) }
    catch [System.Threading.AbandonedMutexException] { $acquired = $true }
    if (-not $acquired) { throw "RPFM research lock is busy" }
    & node (Join-Path $PSScriptRoot "extract-battlefield-batches.mjs") $Kind $Output $RequestFile
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
    if ($acquired) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
