import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

export class FriendtechSharesStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Retrieve environment variables from context
        const providerUrl = this.node.tryGetContext('PROVIDER_URL');
        const contractAddress = this.node.tryGetContext('CONTRACT_ADDRESS');

        // Define the Lambda function
        const friendtechLambda = new lambda.Function(this, 'FriendtechLambdaHandler', {
          runtime: lambda.Runtime.NODEJS_18_X,
          code: lambda.Code.fromAsset(path.join(__dirname, '../lambda'), {
            // Exclude unnecessary files
            exclude: ['*.ts', 'tsconfig.json'],
          }),
          handler: 'index.handler',
          timeout: cdk.Duration.seconds(500),
          environment: {
            PROVIDER_URL: providerUrl,
            CONTRACT_ADDRESS: contractAddress,
          },
        });

        // Define the API Gateway
        const api = new apigateway.RestApi(this, 'friendtech-api', {
            restApiName: 'Friendtech Service',
            description: 'This service retrieves creator fees from the FriendTech contract.',
        });

        const getIntegration = new apigateway.LambdaIntegration(friendtechLambda);
        api.root.addMethod('GET', getIntegration); // GET /
    }
}