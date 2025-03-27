rm -rf ~/.serverless
pip install -r requirements.txt -t .
#serverless plugin install -n serverless-python-requirements
serverless deploy