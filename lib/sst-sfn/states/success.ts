import { Input } from "@pulumi/pulumi";
import { StateBase, StateBaseParams } from "../state";

export interface SuccessParams extends StateBaseParams {
  Result?: Input<Record<string, unknown>>;
  Parameters?: Input<Record<string, unknown>>;
}
export class Success extends StateBase {
  constructor(
    public name: string,
    protected params: SuccessParams = {},
  ) {
    super(name, params);
  }
  toJSON() {
    return {
      ...super.toJSON(true),
      Type: "Succeed",
      ...this.params,
    };
  }
}
