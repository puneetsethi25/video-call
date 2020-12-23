## Jitsi Meet Server setup AWS

### The setup uses Ubuntu 18.04

Launch an AWS EC2 instance with Ubuntu 18.04  distribution and make sure you have the following ports available in your `Security Groups`. 
```
UDP: 10001-10004
TCP: 22 (ssh)
TCP: 80 (http)
TCP: 443 (https)
TCP: 4443
TCP: 5347
TCP: 5222 
```

SSh into the server. Let's make sure all the packages are upto date. Run the following command. 
`apt-get update` 

Lets Install ssl certificates first. We will be using Certbot for that.
```
sudo apt-add-repository ppa:certbot/certbot
sudo apt-get install python-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN_NAME
```

> Note: You can select auto-redirect to https after successful SSL certificate challenge. 

Copy the files paths to SSL key File and SSL Certificate file. It should look something like this.
```
Full local server path to the server SSL key file:
/etc/letsencrypt/live/YOUR_DOMAIN_NAME/privkey.pem
Full local server path to the server SSL certificate file:
/etc/letsencrypt/live/YOUR_DOMAIN_NAME/fullchain.pem
```

### All set lets start with the jitsi package and installations.
#### Step 1
The next step is to run the scripts located in the `scripts` directory. Make sure you have sudo privileges before you run the setup to avoid permission errors later on. 
Run the `pre_setup.sh` file. 
```
$ sh pre_setup.sh
```
>NOTE: The above scripts preforms a reboot of the instance to complete the installtion. If you donot wish to reboot edit the last line on the script file. 
#### Step 2
Run the `setup.sh` file. 
```
$ sh setup.sh
```

The installation will ask you to fill inputs at various points. Make sure to enter the correct values.
Following should be the order of prompts during the installation process.

\1-Domain name: Enter you `Domain name` in the input.

\2-SSL Certificates: Since we have already installed them.  Select  `I want to upload my own`

\3-Set path for installed SSL Certs 
For SSL key file: `/etc/letsencrypt/live/YOUR_DOMAIN_NAME/privkey.pem` 
For SSL Cert file: `/etc/letsencrypt/live/YOUR_DOMAIN_NAME/fullchain.pem` 

\4- Set the APP_ID for authentications of JWT

\5-Set the APP_SECRET for authentications of JWT

> NOTE: Keep this APP_ID and SECRET with you for later use. This will be used to authenticated the JWT for future video calls.

Installation is done. Nginx will also be configured. But at this point you might still see Nginx default page on https. This is because Nginx VirtualHost is still configured with default entry. We need to setup VirtualHost.
#### Step 3

```
$ rm /etc/nginx/sites-available/default
$ rm /etc/nginx/sites-enabled/default
```
If the VirtualHost conf is not enabled in you Nginx, then additionaly you might need to run the following command also:
```
$ ln -s /etc/nginx/sites-available/YOUR_DOMAIN_NAME.conf /etc/nginx/sites-enabled/
```

Restart Nginx:
`sudo /etc/init.d/nginx reload`
>Check in your browser `https://YOUR_DOMAIN_NAME` you should see setup running on the default jitsi installation.

#### Step 4
Setup Prosody
\1. Under you domain config change authentication to "token" :
``` 
VirtualHost "YOUR_DOMAIN_NAME
	authentication = "token";
    app_id = "your_app_id";
    app_secret = "your_app_secret";
    allow_empty_token = false
```
Add the jwt module to prosody.
```
Component "conference.YOUR_DOMAIN_NAME" "muc"
    modules_enabled = { 
    ...
    "token_verification" 
    }
```
#### Step 5
Restart all services
```
$ /etc/init.d/jicofo
$ /etc/init.d/prosody
$ /etc/init.d/jitsi-videobridge2 restart
```
Latest Jitsi Meet setup is now running on your server with JWT implemented.
