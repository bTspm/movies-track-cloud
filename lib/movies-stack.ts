import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { ManagedPolicy, Role, ServicePrincipal, User } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";
import { Construct } from 'constructs';
import * as path from 'path';

export class MoviesStack extends Stack {
  private readonly tableName: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.tableName = 'movies-table';

    const table = this._createDynamoDBTable();
    const searchLambdaFunction = this._createLambdaFunction('search', 'search.ts');
    const extractLambdaFunction = this._createLambdaFunction('extract', 'extract.ts');
    const bucket = this._createS3Bucket();

    this._createApiGateway(searchLambdaFunction);
    this._createIAMUser(bucket);
    this._createS3EventTrigger(extractLambdaFunction, bucket);

    table.grantReadData(searchLambdaFunction);
    table.grantWriteData(extractLambdaFunction);
    bucket.grantRead(extractLambdaFunction);
  }

  private _createDynamoDBTable(): Table {
    return new Table(this, 'Movies-Table', {
      tableName: this.tableName,
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'year', type: AttributeType.NUMBER },
      sortKey: { name: 'code', type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }

  private _createLambdaFunction(name: string, entryFile: string): NodejsFunction {
    const lambdaRole = new Role(this, `Movies-${ name }LambdaRole`, {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      description: `Execution Role for - ${ name }Lambda`,
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaENIManagementAccess'),
      ],
    });

    return new NodejsFunction(this, `Movies-${name}Lambda`, {
      ...MoviesStack._defaultLambdaProps(this.tableName),
      entry: path.join(__dirname, '../src/lambdas', entryFile),
      functionName: `movies-${ name }-lambda`,
      role: lambdaRole,
    });
  }

  private _createApiGateway(lambdaFunction: NodejsFunction): void {
    const api = new RestApi(this, 'Movies-Api', {
      restApiName: 'movies-api',
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: ['Authorization', 'Content-Type'],
        maxAge: Duration.days(1),
      },
    });

    const searchResource = api.root.addResource('search');
    searchResource.addMethod('GET', new LambdaIntegration(lambdaFunction));
  }

  private _createS3Bucket(): Bucket {
    return new Bucket(this, 'Movies-Bucket', {
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }

  private _createIAMUser(bucket: Bucket) {
    const user = new User(this, 'Movies-User');
    bucket.grantWrite(user);
  }

  private _createS3EventTrigger(lambdaFunction: NodejsFunction, bucket: Bucket): void {
    bucket.addEventNotification(EventType.OBJECT_CREATED, new LambdaDestination(lambdaFunction));
    bucket.grantRead(lambdaFunction);
  }

  private static _defaultLambdaProps(tableName: string): Partial<NodejsFunctionProps> {
    return {
      handler: 'handler',
      environment: {
        TABLE_NAME: tableName,
      },
      logRetention: RetentionDays.ONE_MONTH,
      logRetentionRetryOptions: { maxRetries: 10, base: Duration.millis(200) },
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.minutes(15),
      memorySize: 1024,
    };
  }
}
