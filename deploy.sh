#!/bin/bash

##
#   deploy.sh
#   For development, this script automates 
#   the deployment of your current project to a
#   remote device on your local network (using sshpass).
##

DEFAULT_USER=spuq
DEFAULT_HOST=192.168.1.103
APPNAME=Freya
APPCOMP=Core
SERVICENAME="io.freya.Core"
APPDIR=/opt/${APPNAME}/${APPCOMP}

# Let's start with an empty terminal
clear;

# Check whether sshpass is installed
if [[ -z $(which sshpass) ]]; then
    echo "install sshpass to continue. (sudo apt install sshpass)"
    exit 1;
fi

# Remote access credentials
echo -e '\e[0;33m-------------------------------------- \e[m'
echo -e '\e[0;33m For accessing the remote device, the  \e[m'
echo -e '\e[0;33m login credentials are required.       \e[m'
echo -e '\e[0;33m-------------------------------------- \e[m'
# Enter the IP address of the Edgeberry device
read -e -i "$DEFAULT_HOST" -p "Hostname: " HOST
if [[ -z "$HOST" ]]; then
    HOST=$DEFAULT_HOST
fi
# Enter the remote user name
read -e -i "$DEFAULT_USER" -p "User: " USER
if [[ -z "$USER" ]]; then
    USER=$DEFAULT_USER
fi
# Enter the remote user password
# note: character display disabled
stty -echo
read -p "Password: " PASSWORD
stty -echo
echo ''
echo ''

# Create a directory on the device for copying the project to
echo -e '\e[0;32mCreating temporary directory for the project... \e[m'
sshpass -p ${PASSWORD} ssh -o StrictHostKeyChecking=no ${USER}@${HOST} "mkdir ~/temp"


# Copy the relevant project files to the device
echo -e '\e[0;32mCopying project to device...\e[m'
sshpass -p ${PASSWORD} scp -r   ./src \
                                ./package.json \
                                ./tsconfig.json \
                                ./webpack.config.js \
                                ./freya-core.conf \
                                ./io.freya.Core.service \
                                ./climate.conf.js \
                                ${USER}@${HOST}:temp/

# Install the application on remote device
sshpass -p ${PASSWORD} ssh -o StrictHostKeyChecking=no ${USER}@${HOST} << EOF 

    sudo su
    echo -e '\e[0;32mCreating project directory... \e[m'
    mkdir -p $APPDIR
    if [ $? -eq 0 ]; then
        echo -e "\e[0;90mNot a new installation!\e[0m"
    else
        echo -e "\e[0;90mNew installation\e[0m";
    fi

    echo -e '\e[0;32mCopying project to project directory... \e[m'
    cp -r ./temp/* $APPDIR
    rm -rf ./temp

    echo -e '\e[0;32mInstalling project dependencies... \e[m'
    cd $APPDIR/
    npm install --include=dev --verbose

    echo -e '\e[0;32mBuilding the project... \e[m'
    npm run build --verbose

    # Install the Freya Core systemd service
    echo -e -n '\e[mInstalling systemd service \e[m'
    mv -f /opt/${APPNAME}/${APPCOMP}/io.freya.Core.service /etc/systemd/system/
    systemctl daemon-reload
    if [ $? -eq 0 ]; then
        echo -e "\e[0;32m[Success]\e[0m"
    else
        echo -e "\e[0;33m[Failed]\e[0m";
    fi
    # Enable the Freya Core service to run on boot
    echo -e -n '\e[mEnabling service to run on boot \e[m'
    systemctl enable io.freya.Core
    if [ $? -eq 0 ]; then
        echo -e "\e[m[Success]\e[0m"
    else
        echo -e "\e[0;33m[Failed]\e[0m";
    fi


    # Move the D-Bus config file to /etc/dbus-1/system.d
    echo -e '\e[0;32mMoving D-Bus config file to /etc/dbus-1/system.d... \e[m'
    mv -f $APPDIR/freya-core.conf /etc/dbus-1/system.d/

    # (re)start application
    echo -e '\e[0;32mRestarting the application... \e[m'
    systemctl restart $SERVICENAME
    
EOF

exit 0;