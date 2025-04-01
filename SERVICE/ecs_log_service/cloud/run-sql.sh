
DATABASE_URL=""
DATABASE_NAME=""
SCRIPTS_DIR=""
verbose=1

while getopts ":u:d:f:v" OPTION
do
    case $OPTION in
    u)
        DATABASE_URL="$OPTARG"
    ;;
    d)
        DATABASE_NAME="$OPTARG"
    ;; 
    f)
        SCRIPTS_DIR="$OPTARG"
    ;; 
    v)
        verbose=1
    ;;
    [?])
    esac
done

for file in $SCRIPTS_DIR/*.sql
    do psql postgresql://$DATABASE_URL/$DATABASE_NAME -f $file
done