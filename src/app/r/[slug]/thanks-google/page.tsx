import { ThanksGoogleClient } from "./client";

type Props = { searchParams: Promise<{ c?: string; pid?: string }> };

export default async function ThanksGoogle({ searchParams }: Props) {
  const { c, pid } = await searchParams;
  return <ThanksGoogleClient comment={c ?? ""} placeId={pid ?? ""} />;
}
