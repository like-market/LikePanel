#!/bin/bash
####################################
#
# Backup to NFS mount script.
#
####################################

# What to backup.
backup_files="/home/likepanel /home/devlikepanel"

# Where to backup to.
dest="/root"

# Create archive filename.
day=$(date "+%H:%M:%S|%d-%h-%Y")
archive_file="backup-$day.tar.gz"

# Print start status message.
echo "Backing up $backup_files to $dest/$archive_file"

############### MYSQL BACKUP ###############
echo "Backup MySQL likepanel\n"
mysqldump -u root -pr35ImTyr52Ks666 likepanel >> /home/likepanel/"$day"prod.sql
echo "Backup MySQL devlikepanel"
mysqldump -u root -pr35ImTyr52Ks666 devlikepanel >> /home/devlikepanel/"$day"dev.sql

echo "Backup files"
# Backup the files using tar.
tar --exclude='/home/likepanel/node_modules' --exclude='/home/devlikepanel/node_modules' \
--exclude='/home/likepanel/.*' --exclude='/home/devlikepanel/.*' \
-cvzf $dest/$archive_file $backup_files


# Delete MySQL dump
rm /home/likepanel/"$day"prod.sql
rm /home/devlikepanel/"$day"dev.sql


# Print end status message.
echo
echo "Backup finished"
date

# Long listing of files in $dest to check file sizes.
ls -lh $dest
