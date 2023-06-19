import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Bucket, EventType as S3Event } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { ProductsDatasource } from "./datasource/products-datasource";
import { ParseProductsLambda } from "./functions/parse-products/parse-products";
export class AwsSamCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const productsBucket = new Bucket(this, "ProductsBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    const datasource = new ProductsDatasource(this);
    const parseProducts = new ParseProductsLambda(this, {
      bucketName: productsBucket.bucketName,
      tableName: datasource.table.tableName,
    });

    productsBucket.addEventNotification(S3Event.OBJECT_CREATED, parseProducts.s3lambdaDestionation);
    productsBucket.grantRead(parseProducts.lambdaFunction);
    datasource.table.grantWriteData(parseProducts.lambdaFunction);

    new CfnOutput(this, "GraphqlApiUrl", { value: datasource.api.graphqlUrl });
  }
}
