@echo off
setlocal
set API_URL=
IF "%API_URL%"=="" GOTO :NO_AZURE_URL


:START_GETTING_MAC
set MAC_ADDRESS=
FOR /F "tokens=1,2 delims= " %%i IN ('getmac /fo TABLE ^| findstr \Device\') DO call :GET1ST_MAC %%i
goto :END_OF_GETTING_MAC

:GET1ST_MAC
IF "%MAC_ADDRESS%"=="" set MAC_ADDRESS=%1
goto :EOF

:END_OF_GETTING_MAC
echo MAC Address is [%MAC_ADDRESS%]




:LOOP_START
for /f "usebackq delims=" %%a in (`cscript /NoLogo getLeftBatteryPercent.vbs`) do set BATTERY_PERCENT=%%a
echo [battery_value=%BATTERY_PERCENT%] [��]

curl "%API_URL%/add" --data "mac_address=%MAC_ADDRESS%&battery_value=%BATTERY_PERCENT%" -X POST

timeout /T 300 /NOBREAK
GOTO LOOP_START



:NO_AZURE_URL
echo.
echo �A�N�Z�X���Azure URL���A�{�o�b�`�t�@�C������
echo ��API_URL�� �Ɏw�肵�Ă��������B
endlocal
