import { GraphqlApi, MappingTemplate, SchemaFile } from "aws-cdk-lib/aws-appsync";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { join } from "path";

export class ProductsDatasource extends Construct {
  table: Table;
  api: GraphqlApi;

  constructor(scope: Construct) {
    super(scope, "ProductsDatasource");

    this.api = new GraphqlApi(this, "Api", {
      name: "ProductsApi",
      schema: SchemaFile.fromAsset(join(__dirname, "schema.graphql")),
    });

    this.table = new Table(this, "ProductsTable", {
      partitionKey: {
        name: "sku",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const datasource = this.api.addDynamoDbDataSource("ProductsDataSource", this.table);

    datasource.createResolver("QueryGetProductsResolver", {
      typeName: "Query",
      fieldName: "getProducts",
      requestMappingTemplate: MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "Scan",
          "limit": $util.defaultIfNull($ctx.args.limit, 20),
          "nextToken": $util.toJson($util.defaultIfNullOrEmpty($ctx.args.nextToken, null))
        }
      `),
      responseMappingTemplate: MappingTemplate.fromString(`
        $util.toJson($ctx.result)
      `),
    });
  }
}
