"use client";

import { Accordion, AccordionItem, Button, Card, CardBody, CardHeader, Divider, Input } from "@nextui-org/react";
import { Montserrat } from "next/font/google";
import { FaAt, FaMagnifyingGlass, FaQuestion } from "react-icons/fa6";

const montserrat = Montserrat({ subsets: ["latin"] });

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center my-12">
      <div className="flex flex-col items-center justify-center max-w-4xl px-4 gap-8">
        <h1 className={`${montserrat.className} text-4xl text-bold`}>
          Is @Username<br />Shadowbanned on X (Twitter)?
        </h1>
        <Card className="dark:bg-neutral-800 w-full p-4">
          <CardBody>
            <div className="flex">
              <Input radius="full" type="text" color="primary" placeholder="X" labelPlacement="outside" startContent={<FaAt />} />
              <Button isIconOnly radius="full" color="primary" className="ml-2">
                <FaMagnifyingGlass />
              </Button>
            </div>
          </CardBody>
        </Card>
        <Divider />
        <Card className="dark:bg-neutral-800 w-full">
          <CardHeader>
            <h2 className="text-bold">シャドウバンとは？</h2>
          </CardHeader>
          <div className="px-4">
            <Divider />
          </div>
          <CardBody>
            <p>シャドウバンとは、X (Twitter) において、アカウントがロックや凍結されていないにも関わらず、検索結果や返信一覧に表示されなく(ずらく)なる状態のことです。</p>
          </CardBody>
        </Card>
        <Accordion variant="shadow" className="dark:bg-neutral-800 w-full">
          <AccordionItem key="1" aria-label="Search Suggestion Ban" title="Search Suggestion Ban" startContent={<FaQuestion className="text-xl text-blue-500" />}>
            <h3 className="text-xl text-bold">検索候補からの除外</h3>
            <p>検索画面において、検索候補から該当のアカウントが表示されなくなります。</p>
          </AccordionItem>
          <AccordionItem key="2" aria-label="Search Ban" title="Search Ban" startContent={<FaQuestion className="text-xl text-blue-500" />}>
            <h3 className="text-xl text-bold">検索結果からの除外</h3>
            <p>検索結果から、該当のアカウントのツイートやアカウントが表示されなくなります。</p>
          </AccordionItem>
          <AccordionItem key="3" aria-label="Ghost Ban" title="Ghost Ban" startContent={<FaQuestion className="text-xl text-blue-500" />}>
            <h3 className="text-xl text-bold">返信一覧からの除外</h3>
            <p>ポストに対する返信が返信一覧から表示されなくなり、ポスト投稿主への通知もされなくなります。</p>
          </AccordionItem>
          <AccordionItem key="4" aria-label="Reply Deboosting" title="Reply Deboosting" startContent={<FaQuestion className="text-xl text-blue-500" />}>
            <h3 className="text-xl text-bold">返信一覧での表示順の低下</h3>
            <p>ポストに対する返信が返信一覧にて、下部に表示されるようになります。<br />また、「さらに返信を表示する」をタップするまで返信が表示されなくなる場合があります。</p>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
