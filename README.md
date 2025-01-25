# What's CodeSync?
CodeSync is a small solution I made for synchronizing files (mostly source codes) across multiple devices. Whenever I was working on something on my PC and then needed to switch to laptop,
I had to zip all the projects, and then somehow (usually Google Drive) copy them to laptop. This WAS an annoying process and I started to look for a solution.

I had found some programs that could do something like this, but they usually require both devices to be powered on and connected to the same Wi-Fi and I didn't like that much. I wanted to be able
to sync files whenever I wanted regardless of device being turned on or off.

**Still working on the README file. Some parts will be filled in, some parts changed (like npm run dev).**

## How does it work?
Whenever you are coding or working on a project, at the end of your coding session you do "codesync push". This will upload all changes to the server and then you can download these files on any other device
by running "codesync fetch". Before fetching, you can also use the command "codesync list" to see all the changes between current version and the version on the remote server.

## How to set up?
### Server
To run the server, you need to have NodeJS installed and MySQL database. After you clone this repository, go inside the server folder and create a ".env" file. Then set the following values:
*will fill in later*. Run the "npm i" command. Run "npm run dev" to start the server.

### Client
After you clone this repository, go inside the client folder and create a ".env" file. Then, set the following values:
*will fill in later*.

Open the command prompt in the client folder, run "npm i" and then run "npm i -g".

## How to set up a project?
Open a folder of a project you wish to set up. Then, open a command prompt from inside of that folder. Use "codesync init" to begin the project setup. This command will guide you through the project setup
process. It is recommended to do "codesync push" when the project is initialized.

### How do I sync it will other devices?
You need to install CodeSync on other devices for sync to work, but you only need the "client" part. In the .env set the following values: *will fill in later*. To set up a project for syncing, create a folder
where files for that project will be stored. Then, run the "codesync init". Make sure project has the same name as on the first device. Then, run "codesync fetch". All files will be downloaded.

Every time you wish to download files on another device use "codesync fetch", and every time you wish to upload files use "codesync push". Command "codesync push --watch" will be made later.
Of course, "codesync fetch" and "codesync push" work on all devices, you can upload from any device and you can download to any device.
