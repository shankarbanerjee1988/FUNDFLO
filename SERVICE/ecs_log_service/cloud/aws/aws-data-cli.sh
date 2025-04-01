curl="curl"
jq="jq"

verbose=1

DATABASE_URL=""
DATABASE_NAME=""
SCRIPTS_DIR=""
verbose=1

while getopts ":p:v" OPTION
do
    case $OPTION in
    p)
        PASS_KEY="$OPTARG"
    ;;
    v)
        verbose=1
    ;;
    [?])
    esac
done

echo '{}' > cloud/aws/aws-data.json

# SECRET_ARN=$(aws secretsmanager get-secret-value --secret-id $PASS_KEY | jq -r '.SecretString' | jq --raw-output '.SECRET_ARN' )
# SECRET_ARN="$(echo "${SECRET_ARN}" | tr -d '[:space:]')"

SECRET_ARN=$(aws secretsmanager get-secret-value --secret-id $PASS_KEY | jq --raw-output '.ARN' )
SECRET_ARN="$(echo  "${SECRET_ARN}" | tr -d '[:space:]')"
echo "SECRET_ARN.......$SECRET_ARN"

# DB_HOST=$(aws secretsmanager get-secret-value --secret-id $PASS_KEY | jq -r '.SecretString' | jq --raw-output '.DB_HOST' )
# DB_HOST="$(echo "${DB_HOST}" | tr -d '[:space:]')"

DB_PORT=$(aws secretsmanager get-secret-value --secret-id $PASS_KEY | jq -r '.SecretString' | jq --raw-output '.DB_PORT' )
DB_PORT="$(echo "${DB_PORT}" | tr -d '[:space:]')"

# DB_USER=$(aws secretsmanager get-secret-value --secret-id $PASS_KEY | jq -r '.SecretString' | jq --raw-output '.DB_USER' )
# DB_USER="$(echo  "${DB_USER}" | tr -d '[:space:]')"

# DB_PASS=$(aws secretsmanager get-secret-value --secret-id $PASS_KEY | jq -r '.SecretString' | jq --raw-output '.DB_PASS' )
# DB_PASS="$(echo  "${DB_PASS}" | tr -d '[:space:]')"

# DB_NAME=$(aws secretsmanager get-secret-value --secret-id $PASS_KEY | jq -r '.SecretString' | jq --raw-output '.DB_NAME' )
# DB_NAME="$(echo  "${DB_NAME}" | tr -d '[:space:]')"


PORT=$(aws secretsmanager get-secret-value --secret-id $PASS_KEY | jq -r '.SecretString' | jq --raw-output '.PORT' )
PORT="$(echo  "${PORT}" | tr -d '[:space:]')"

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --output text --query Account)
AWS_ACCOUNT_ID="$(echo "${AWS_ACCOUNT_ID}" | tr -d '[:space:]')"
echo "AWS_ACCOUNT_ID.......$AWS_ACCOUNT_ID"

# DATABASE_URL="${DATABASE_USERNAME}:${DATABASE_PASSWORD}@${DATABASE_HOST}:5432";

echo "EXIT CODE: $lastexitcode"
echo '{
        "SECRET_ARN": "'${SECRET_ARN}'",
        "PORT": "'${PORT}'",
        "DB_PORT": "'${DB_PORT}'",
        "AWS_ACCOUNT_ID": "'${AWS_ACCOUNT_ID}'"
     }' > cloud/aws/aws-data.json
