# Tennis-Competition-Management-Platform

To get the project working properly, ensure you have node, node package manager (npm) and npx installed. You can clone the repository and run "npm i" from command in the root directory of the repository to install the necessary packages to local. 

IMPORTANT retification, lets all collectively use node verion 22, since I was having a problem with getting the backend to run properly on node@23 since its an experimental version. It shouldn't be too difficult to make this change, it will likely just involve downloading node@22 and setting this as the default running version. You can check your current version with node --version in terminal. Please note that this step is really important and you will not be able to run the backend.

For the backend setup, you will need to download docker and have the docker app open in the background. You can run command "docker compose up -d" from the root directory to have the postgreSQL db running. Currently the project is setup with Prisma for creating easy schemas for the db, but we can change this if it is causing a headache.

Useful commands when working docker are:
"docker compose down -v" to delete the current volume, essentially wiping the db to a clean slate

To start the docker during development, you can just click the play button on the tennis-management-system docker container in the docker app and everything will be good to go!

To setup prisma and get all of the required environment files, run inside of backend/ "npx prisma orm init" and click yes to everything and write backend at the end to get a clean slate. Update the .env file to this currently:

DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase"

This will tell prisma where the db is currently running with the password to enter the db, and it is also important so your backend can connect to the db as well.

The .env file DATABASE_URL will need to match with the settings in the docker-compose.yml file to work properly. As long as you haven't changed the docker-compose file, this will be the correct url string. Make sure to never commit this file to the repository and also never commit any module files, but these are already in .gitignore already so don't stress.

Now everything should be setup and connected properly and we can start making changes to the schema.

When we update the backend schema and want to push the changes onto the db, we can run these commands from the backend directory:
"npx prisma contract emit"
"npx prisma migration plan --name add_new_feature"
"npx prisma db migrate --advance-ref db"

If these commands work without any errors, then prisma should be setup correctly.

Finally, we can run the backend with the command "npm run start:dev" when instead of the backend directory. Ensure docker is running prior to running this command. If you do not get any errors everything should be working properly. I added some test code to ensure everything is working properly together, if you visit http://localhost:3000 while the backend is running, you should see a json file with a fake user created.

Yay! If we make it to this message, then we are ready to start development. For those that are having any problems, don't be affraid to consult me or your AI best friend. Goodluck, hopefully you don't get any malware in the process :)
