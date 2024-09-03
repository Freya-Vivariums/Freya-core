#!/bin/bash

##
#   Install.sh
#   Installation script for the Freya Core software and
#   the software it relies on.
#
#   by Sanne 'SpuQ' Santens
##

APPNAME=Freya
APPCOMP=Core
REPONAME=Freya-core
REPOOWNER=Freya-Vivariums

# Check if this script is running as root. If not, notify the user
# to run this script again as root and cancel the installtion process
if [ "$EUID" -ne 0 ]; then
    echo -e "\e[0;31mUser is not root. Exit.\e[0m"
    echo -e "\e[0mRun this script again as root\e[0m"
    exit 1;
fi

# Start a clean screen
clear;

# Freya banner
echo -e "                      +#+                                             "
echo -e "            :=       :#%#=                                            "
echo -e "            =@@@*    *%%%#                                            "
echo -e "            =@@@@@@.:#%%%%#                                           "
echo -e "            :@@@@@@#=%%%%%%=                                          "
echo -e "        %@@%*#@@@@@+#%%%%%%#                                          "
echo -e "        -@@@@*@@@@@-#%%%%%%%:    _____  ____   _____ __   __    _     "
echo -e "         -@@@%#@@@@:#%%%%%%%*   |  ___||  _ \ | ____|\ \ / /   / \ TM "
echo -e "          =@@@*@@@@=#%%%%%%%#   | |_   | |_) ||  _|   \ V /   / _ \   "
echo -e "          -=@@@+@@@##%%%%%%%#   |  _|  |  _ < | |___   | |   / ___ \  "
echo -e "       %%%%%:%@@+%@@=#%%%%%%=   |_|    |_| \_\|_____|  |_|  /_/   \_\ "
echo -e "     =%%%%%%%+-%@%-@%+#%%%%#                  Vivarium Control System "
echo -e "       %%%%%%%%* #@#=#=#%%#                                           "
echo -e "         %%%%%%%%%=-:::-:                                             "
echo -e "            #%%%%%%%%%*                                               "

##
#   Install dependencies
##

# Check for NodeJS. If it's not installed, install it.
echo -n -e "\e[0mChecking for NodeJS \e[0m"
if which node >/dev/null 2>&1; then 
    echo -e "\e[0;32m[Installed] \e[0m";
else 
    echo -e "\e[0;33m[Not installed] \e[0m";
    echo -n -e "\e[0mInstalling Node using apt \e[0m";
    apt install -y nodejs > /dev/null 2>&1;
    # Check if the last command succeeded
    if [ $? -eq 0 ]; then
        echo -e "\e[0;32m[Success]\e[0m"
    else
        echo -e "\e[0;33mFailed! Exit.\e[0m";
        exit 1;
    fi
fi

# Check for NPM. If it's not installed, install it.
echo -n -e "\e[0mChecking for Node Package Manager (NPM) \e[0m"
if which npm >/dev/null 2>&1; then 
    echo -e "\e[0;32m[Installed] \e[0m"; 
else 
    echo -e "\e[0;33m[Not installed] \e[0m";
    echo -n -e "\e[0mInstalling NPM using apt \e[0m";
    apt install -y npm > /dev/null 2>&1;
    # Check if the last command succeeded
    if [ $? -eq 0 ]; then
        echo -e "\e[0;32m[Success]\e[0m"
    else
        echo -e "\e[0;33mFailed! Exit.\e[0m";
        exit 1;
    fi
fi

# Check for JQ (required by this script). If it's not installed,
# install it.
echo -n -e "\e[0mChecking for jq \e[0m"
if which jq >/dev/null 2>&1; then  
    echo -e "\e[0;32m[Installed] \e[0m"; 
else 
    echo -e "\e[0;33m[Not installed] \e[0m";
    echo -n -e "\e[0mInstalling jq using apt \e[0m";
    apt install -y jq > /dev/null 2>&1
    # Check if the last command succeeded
    if [ $? -eq 0 ]; then
        echo -e "\e[0;32m[Success]\e[0m"
    else
        echo -e "\e[0;33mFailed! Exit.\e[0m";
        exit 1;
    fi
fi


##
#   Application
##

# Check for the latest release of the EdgeBerry application using the
# GitHub API
echo -n -e "\e[0mGetting latest ${APPNAME} release info \e[0m"
latest_release=$(curl -H "Accept: application/vnd.github.v3+json" -s "https://api.github.com/repos/${REPOOWNER}/${REPONAME}/releases/latest")
# Check if this was successful
if [ -n "$latest_release" ]; then
    echo -e "\e[0;32m[Success]\e[0m"
else
    echo -e "\e[0;33mFailed to get latest ${APPNAME} release info! Exit.\e[0m";
    exit 1;
fi
# Get the asset download URL from the release info
echo -n -e "\e[0mGetting the latest ${APPNAME} release download URL \e[0m"
asset_url=$(echo "$latest_release" | jq -r '.assets[] | select(.name | test("Freya-core-v[0-9]+\\.[0-9]+\\.[0-9]+\\.tar\\.gz")) | .url')
# If we have an asset URL, download the tarball
if [ -n "$asset_url" ]; then
    #echo -e "\e[0;32mURL:\e[0m ${asset_url}";
    echo -e "\e[0;32m[Success]\e[0m"; 
    echo -n -e "\e[0mDownloading the application \e[0m"
    curl -L \
    -H "Accept: application/octet-stream" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    -o "repo.tar.gz" \
    "$asset_url" > /dev/null 2>&1
    # Check if the download was successful
    if [ $? -eq 0 ]; then
        echo -e "\e[0;32m[Success]\e[0m"
    else
        echo -e "\e[0;33mFailed! Exit.\e[0m";
        exit 1;
    fi
else
    echo -e "\e[0;33mFailed! Exit.\e[0m";
    exit 1;
fi

#Untar the application in the application folder
echo -n -e "\e[0mUnpacking the application \e[0m"
mkdir -p /opt/${APPNAME}/${APPCOMP}  > /dev/null 2>&1;
tar -xvzf repo.tar.gz -C /opt/${APPNAME}/${APPCOMP} > /dev/null 2>&1
# Check if the last command succeeded
if [ $? -eq 0 ]; then
    echo -e "\e[0;32m[Success]\e[0m"
else
    echo -e "\e[0;33mFailed! Exit.\e[0m";
    exit 1;
fi

# Install package dependencies
echo -n -e "\e[0mInstalling dependencies \e[0m"
npm install --prefix /opt/${APPNAME}/${APPCOMP}
# > /dev/null 2>&1
# Check if the last command succeeded
if [ $? -eq 0 ]; then
    echo -e "\e[0;32m[Success]\e[0m"
else
    echo -e "\e[0;33mFailed! Exit.\e[0m";
    exit 1;
fi

# Cleanup the download
rm -rf repo.tar.gz

# Install the Freya Core systemd service
echo -e -n '\e[0;32mInstalling systemd service... \e[m'
mv -f /opt/${APPNAME}/${APPCOMP}/io.freya.Core.service /etc/systemd/system/
systemctl daemon-reload
if [ $? -eq 0 ]; then
    echo -e "\e[0;32m[Success]\e[0m"
else
    echo -e "\e[0;33m[Failed]\e[0m";
fi
# Enable the Freya Core service to run on boot
echo -e -n '\e[0;32mEnabling service to run on boot... \e[m'
systemctl enable io.freya.Core
if [ $? -eq 0 ]; then
    echo -e "\e[0;32m[Success]\e[0m"
else
    echo -e "\e[0;33m[Failed]\e[0m";
fi

# Move the dbus policy to the /etc/dbus-1/system.d directory
echo -e '\e[0;32mInstalling D-Bus policy... \e[m'
mv -f /opt/${APPNAME}/${APPCOMP}/freya-core.conf /etc/dbus-1/system.d/

# Start the service
systemctl start io.freya.Core

exit 0;