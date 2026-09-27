param([Parameter(Mandatory=$true)][string]$Request, [Parameter(Mandatory=$true)][string]$Output, [string]$Snapshot = "9.0.1")
$mutex = [System.Threading.Mutex]::new($false, "Local\ComputationalTotalWarRpfmResearch")
$acquired = $false
try {
    try { $acquired = $mutex.WaitOne(0) }
    catch [System.Threading.AbandonedMutexException] { $acquired = $true }
    if (-not $acquired) { throw "RPFM research lock is busy; retry after the active extraction." }
    & node (Join-Path $PSScriptRoot "extract-battlefield-probe.mjs") $Request $Output $Snapshot
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
    if ($acquired) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
