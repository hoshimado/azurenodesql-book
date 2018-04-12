Set rows = GetObject("winmgmts:\\.\root\cimv2").ExecQuery("Select * from Win32_Battery",,48)
 
For Each row in rows
    Wscript.Echo row.EstimatedChargeRemaining
Next

