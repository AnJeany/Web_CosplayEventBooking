# E2E Integration Test for Web_CosplayEventBooking
$baseUrl = "http://localhost:5056/api"

# Helpers
function Invoke-Post([string]$url, $body, [string]$token = $null) {
    $headers = @{ "Content-Type" = "application/json" }
    if ($token) {
        $headers.Add("Authorization", "Bearer $token")
    }
    $json = $body | ConvertTo-Json -Depth 100
    try {
        $resp = Invoke-RestMethod -Uri "$baseUrl/$url" -Method Post -Headers $headers -Body $json
        return $resp
    } catch {
        Write-Error $_.Exception
        $streamReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errResp = $streamReader.ReadToEnd()
        Write-Host "Error details: $errResp" -ForegroundColor Red
        throw $_
    }
}

function Invoke-Get([string]$url, [string]$token = $null) {
    $headers = @{}
    if ($token) {
        $headers.Add("Authorization", "Bearer $token")
    }
    return Invoke-RestMethod -Uri "$baseUrl/$url" -Method Get -Headers $headers
}

# 1. Login as Organizer
Write-Host "--- 1. Logging in as Organizer ---" -ForegroundColor Cyan
$orgLogin = Invoke-Post "auth/login" @{
    email = "organizer@cosbook.com"
    password = "Password123!"
}
$orgToken = $orgLogin.token
$orgId = $orgLogin.user.id
Write-Host "Logged in successfully as Organizer. ID: $orgId" -ForegroundColor Green

# 2. Create Event with Ticket Types and Sale Dates
Write-Host "`n--- 2. Creating Event with Ticket Types and Sale Dates ---" -ForegroundColor Cyan
$startTime = (Get-Date).AddDays(5).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$endTime = (Get-Date).AddDays(6).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$saleStart = (Get-Date).AddMinutes(-5).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") # Open now
$saleEnd = (Get-Date).AddDays(4).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

$eventBody = @{
    organizerId = $orgId
    title = "E2E Test Cosplay Festival"
    description = "Test event for multi-tier tickets and schedules."
    location = "Ho Chi Minh City"
    startTime = $startTime
    endTime = $endTime
    ticketPrice = 150000
    totalTickets = 100
    hasBooth = $true
    ticketSaleStartDate = $saleStart
    ticketSaleEndDate = $saleEnd
    ticketTypes = @(
        @{ name = "VIP Pass"; price = 250000; totalTickets = 5 },
        @{ name = "Standard Pass"; price = 120000; totalTickets = 15 }
    )
}

$newEvent = Invoke-Post "events" $eventBody $orgToken
$eventId = $newEvent.id
Write-Host "Event created successfully! Event ID: $eventId" -ForegroundColor Green

# 3. Retrieve Event and Verify properties
Write-Host "`n--- 3. Verifying Created Event and Ticket Types ---" -ForegroundColor Cyan
$eventDetail = Invoke-Get "events/$eventId"
Write-Host "Event Title: $($eventDetail.title)"
Write-Host "TicketSaleStartDate: $($eventDetail.ticketSaleStartDate)"
Write-Host "TicketSaleEndDate: $($eventDetail.ticketSaleEndDate)"
Write-Host "Ticket Types:"
foreach ($tt in $eventDetail.ticketTypes) {
    Write-Host "  - Name: $($tt.name), Price: $($tt.price), Total: $($tt.totalTickets)"
}

$vipTicketType = $eventDetail.ticketTypes | Where-Object { $_.name -eq "VIP Pass" }
$vipTypeId = $vipTicketType.id

# 4. Login as Customer
Write-Host "`n--- 4. Logging in as Customer ---" -ForegroundColor Cyan
$custLogin = Invoke-Post "auth/login" @{
    email = "customer@cosbook.com"
    password = "Password123!"
}
$custToken = $custLogin.token
$custId = $custLogin.user.id
Write-Host "Logged in successfully as Customer. ID: $custId" -ForegroundColor Green

# 5. Purchase Ticket with selected Ticket Type
Write-Host "`n--- 5. Purchasing VIP Ticket ---" -ForegroundColor Cyan
$purchaseBody = @{
    eventId = $eventId
    customerId = $custId
    ticketTypeId = $vipTypeId
    quantity = 1
}
$purchaseResult = Invoke-Post "tickets/purchase" $purchaseBody $custToken
Write-Host "Purchase successful! Ticket ID: $($purchaseResult.id)" -ForegroundColor Green

# 6. Retrieve Customer's tickets and verify details
Write-Host "`n--- 6. Verifying Customer Ticket details ---" -ForegroundColor Cyan
$myTickets = Invoke-Get "tickets?customerId=$custId" $custToken
$purchasedTicket = $myTickets | Where-Object { $_.event.id -eq $eventId }
Write-Host "Ticket ID: $($purchasedTicket.id)"
Write-Host "Selected Ticket Type Name: $($purchasedTicket.ticketType.name)"
Write-Host "Selected Ticket Type Price: $($purchasedTicket.ticketType.price)"
if ($purchasedTicket.ticketType.name -eq "VIP Pass" -and $purchasedTicket.ticketType.price -eq 250000) {
    Write-Host "SUCCESS: Ticket classification correctly verified!" -ForegroundColor Green
} else {
    Write-Error "FAIL: Ticket classification mismatch."
}
