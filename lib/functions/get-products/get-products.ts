import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export class GetProducts extends Construct {
  lambdaFunction: NodejsFunction;
  constructor(scope: Construct) {
    super(scope, "GetProducts");
    this.lambdaFunction = new NodejsFunction(this, "function");
    new LambdaRestApi(this, "apigw", {
      handler: this.lambdaFunction,
    });
  }
}
