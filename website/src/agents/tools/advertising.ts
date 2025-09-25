/**
 * Spin up an ad campaign and cross fingers for conversions.
 * @param platform Ad network being targeted.
 * @param budget Dollars to burn.
 * @param creative Ad creative identifier.
 * @returns fake campaign id.
 */
export async function launchCampaign(platform: string, budget: number, creative: string): Promise<string> {
  return `${platform}-${budget}-${creative}`;
}
