import { Duration } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";
import { Construct } from "constructs";

type Params = {
  bucketName: string;
  tableName: string;
};

export class ParseProductsLabda extends Construct {
  s3lambdaDestionation: LambdaDestination;
  lambdaFunction: NodejsFunction;

  constructor(scope: Construct, params: Params) {
    super(scope, "ParseProductsLabda");
    const { bucketName, tableName } = params;

    this.lambdaFunction = new NodejsFunction(this, "function", {
      bundling: {
        externalModules: ["aws-sdk", "pg-native"],
      },
      timeout: Duration.minutes(5),
      environment: {
        BUCKET_NAME: bucketName,
        TABLE_NAME: tableName,
      },
    });

    this.s3lambdaDestionation = new LambdaDestination(this.lambdaFunction);
  }
}
