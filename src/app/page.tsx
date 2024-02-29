"use client";

import { Accordion, AccordionItem, Avatar, Button, Card, CardBody, CardHeader, Divider, Input } from "@nextui-org/react";
import { Montserrat } from "next/font/google";
import { useState } from "react";
import { FaAt, FaBan, FaCheck, FaMagnifyingGlass, FaQuestion } from "react-icons/fa6";
import { hc } from "hono/client";
import { ResultsSchema } from "./api/[[...slug]]/schemas";
import { AppType } from "./api/[[...slug]]/route";
import { z } from "@hono/zod-openapi";

const montserrat = Montserrat({ subsets: ["latin"] });

export default function Home() {
  const [username, setUsername] = useState("");
  const [results, setResults] = useState<z.infer<typeof ResultsSchema>>();
  const [loading, setLoading] = useState(false);
  const client = hc<AppType>('/api');
  const test = async (screenName: string) => {
    setLoading(true);
    const results = await client.test.$get({
      query: {
        screen_name: screenName,
      },
    });
    setLoading(false);
    setResults(await results.json());
  }
  return (
    <div className="flex flex-col items-center justify-center my-12">
      <div className="flex flex-col items-center justify-center max-w-4xl w-full px-4 gap-8">
        <h1 className={`${montserrat.className} text-4xl`}>
          Is @{username ? username : 'Username'}<br />Shadowbanned on X (Twitter)?
        </h1>
        <Card className="dark:bg-neutral-800 w-full p-4">
          <CardBody>
            <div className="flex">
              <Input radius="full" type="text" placeholder="X" labelPlacement="outside" startContent={<FaAt />} onChange={(e) => setUsername(e.target.value)} />
              <Button isIconOnly radius="full" color="primary" type="submit" isLoading={loading} className="ml-2" onClick={() => test(username)}>
                <FaMagnifyingGlass />
              </Button>
            </div>
          </CardBody>
        </Card>
        <Divider />
        <Card className="dark:bg-neutral-800 w-full">
          <CardHeader>
            {results ? results.user ? results.user.__typename === 'User' ? (
              <div className="flex gap-2">
                <Avatar size="lg" src={results.user.legacy.profile_image_url_https} />
                <div>
                  <h2 className="text-lg text-bold">{results.user.legacy.name}</h2>
                  <p>@{results.user.legacy.screen_name}</p>
                </div>
              </div>
            ) : (
              <h2 className="text-bold">ユーザーが凍結されています。</h2>
            ) : (
              <h2 className="text-bold">ユーザーが見つかりませんでした。</h2>
            ) : (
              <h2 className="text-bold">シャドウバンとは？</h2>
            )}
          </CardHeader>
          <div className="px-4">
            <Divider />
          </div>
          <CardBody>
            {results ? results.user ? results.user.__typename === 'User' ? (
              <p>{results.user.legacy.description}</p>
            ) : (
              <p>ユーザー情報にアクセスできませんでした、ユーザーが凍結されているかもしれません</p>
            ) : (
              <p>ユーザー情報にアクセスできませんでした、ユーザーが見つかりませんでした</p>
            ) : (
              <p>シャドウバンとは、X (Twitter) において、アカウントがロックや凍結されていないにも関わらず、検索結果や返信一覧に表示されなく(ずらく)なる状態のことです。</p>
            )}

          </CardBody>
        </Card>
        <Accordion variant="shadow" className="dark:bg-neutral-800 w-full">
          <AccordionItem key="1" aria-label="Search Suggestion Ban" title="Search Suggestion Ban" startContent={
            results && results.user && results.user.__typename === 'User' && !results.protect && !results.no_tweet ? results.search_suggestion_ban ? (
              <FaBan className="text-xl text-red-500" />
            ) : (
              <FaCheck className="text-xl text-green-500" />
            ) : (
              <FaQuestion className="text-xl text-blue-500" />
            )
          }>
            <h3 className="text-xl text-bold">検索候補からの除外</h3>
            <p>検索画面において、検索候補から該当のアカウントが表示されなくなります。</p>
          </AccordionItem>
          <AccordionItem key="2" aria-label="Search Ban" title="Search Ban" startContent={
            results && results.user && results.user.__typename === 'User' && !results.protect && !results.no_tweet ? results.search_ban ? (
              <FaBan className="text-xl text-red-500" />
            ) : (
              <FaCheck className="text-xl text-green-500" />
            ) : (
              <FaQuestion className="text-xl text-blue-500" />
            )
          }>
            <h3 className="text-xl text-bold">検索結果からの除外</h3>
            <p>検索結果から、該当のアカウントのツイートやアカウントが表示されなくなります。</p>
          </AccordionItem>
          <AccordionItem key="3" aria-label="Ghost Ban" title="Ghost Ban" startContent={
            results && results.user && results.user.__typename === 'User' && !results.protect && !results.no_tweet && !results.no_reply ? results.ghost_ban ? (
              <FaBan className="text-xl text-red-500" />
            ) : (
              <FaCheck className="text-xl text-green-500" />
            ) : (
              <FaQuestion className="text-xl text-blue-500" />
            )
          }>
            <h3 className="text-xl text-bold">返信一覧からの除外</h3>
            <p>ポストに対する返信が返信一覧から表示されなくなり、ポスト投稿主への通知もされなくなります。</p>
          </AccordionItem>
          <AccordionItem key="4" aria-label="Reply Deboosting" title="Reply Deboosting" startContent={
            results && results.user && results.user.__typename === 'User' && !results.protect && !results.no_tweet && !results.no_reply ? results.reply_deboosting ? (
              <FaBan className="text-xl text-red-500" />
            ) : (
              <FaCheck className="text-xl text-green-500" />
            ) : (
              <FaQuestion className="text-xl text-blue-500" />
            )
          }>
            <h3 className="text-xl text-bold">返信一覧での表示順の低下</h3>
            <p>ポストに対する返信が返信一覧にて、下部に表示されるようになります。<br />また、「さらに返信を表示する」をタップするまで返信が表示されなくなる場合があります。</p>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
