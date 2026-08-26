
Write-Host ""
Write-Host "========================================"
Write-Host "       AYUCOMPILE - FULL TEST"
Write-Host "========================================"
Write-Host ""

$tests = @(
    "hello",
    "functions",
    "nested_if",
    "nested_loops",
    "arrays",
    "precedence"
)

$passed = 0
$failed = 0

foreach ($test in $tests) {

    Write-Host ""
    Write-Host "----------------------------------------"
    Write-Host "TEST: $test.ayu"
    Write-Host "----------------------------------------"

    node src/index.js "examples/$test.ayu"

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ COMPILE FAILED: $test" -ForegroundColor Red
        $failed++
        continue
    }

    node "examples/$test.js"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PASSED: $test" -ForegroundColor Green
        $passed++
    }
    else {
        Write-Host "❌ RUNTIME FAILED: $test" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host "             TEST SUMMARY"
Write-Host "========================================"
Write-Host "PASSED : $passed"
Write-Host "FAILED : $failed"
Write-Host "========================================"
Write-Host ""

Write-Host "Input test alag se run hoga:"
Write-Host "node src/index.js examples/input.ayu"
Write-Host "node examples/input.js"

Write-Host ""
Write-Host "Error test alag se run hoga:"
Write-Host "node src/index.js examples/error.ayu"
Write-Host ""

