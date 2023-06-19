import { TransactWriteItem } from "@aws-sdk/client-dynamodb";
export interface ObjectKeysMapper {
  "products.csv": (tableName: string, item: Product) => TransactWriteItem;
  "stocks.csv": (tableName: string, item: ProductStock) => TransactWriteItem;
}

export type Mapper = <T>(tableName: string, item: T) => TransactWriteItem;

export interface Product extends BaseProduct {
  name: string;
  price: string;
}

export interface ProductStock extends BaseProduct {
  quantity: string;
}

export interface BaseProduct {
  sku: string;
}
