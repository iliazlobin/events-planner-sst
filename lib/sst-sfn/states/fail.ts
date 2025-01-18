import { Input } from "@pulumi/pulumi";
import { StateBase, StateBaseParams } from "../state";

export interface FailParams extends StateBaseParams {
  Result?: Input<Record<string, unknown>>;
  Parameters?: Input<Record<string, unknown>>;
}
export class Fail extends StateBase {
  constructor(
    public name: string,
    protected params: FailParams = {},
  ) {
    super(name, params);
  }
  toJSON() {
    return {
      ...super.toJSON(true),
      Type: "Fail",
      ...this.params,
    };
  }
}
