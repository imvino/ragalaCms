"directus": "9.0.0-rc.101" to 10.0.0

env don't work in vue template

###Rename column name on failure

"alter table `directus_users` add `auth_data` json"

 "alter table `directus_webhooks` add `headers` json"


###For new project
npx directus init

npx directus bootstrap

###For migration
npm install directus@10.0.0

npx directus database migrate:latest

###To downgrade
npx directus database migrate:down