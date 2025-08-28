"use client";

import { Accordion, AccordionItem, Avatar, Button, Card, CardBody, CardHeader, Divider, Input } from "@nextui-org/react";
import { Montserrat } from "next/font/google";
import { useState, useMemo, useCallback, memo } from "react";
import { FaAt, FaMagnifyingGlass } from "react-icons/fa6";
import { hc } from "hono/client";
import { TestQuerySchema, ResultsSchema } from "./api/[[...slug]]/schemas";
import { AppType } from "./api/[[...slug]]/route";
import { z } from "@hono/zod-openapi";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";

// 動的インポートでアイコンを遅延読み込み
const FaBan = dynamic(() => import("react-icons/fa6").then(mod => ({ default: mod.FaBan })), { ssr: false });
const FaCheck = dynamic(() => import("react-icons/fa6").then(mod => ({ default: mod.FaCheck })), { ssr: false });
const FaQuestion = dynamic(() => import("react-icons/fa6").then(mod => ({ default: mod.FaQuestion })), { ssr: false });

const montserrat = Montserrat({ subsets: ["latin"] });

const XProtectIcon = memo(({ ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-label="非公開アカウント" role="img" {...props}>
    <g>
      <path d="M17.5 7H17v-.25c0-2.76-2.24-5-5-5s-5 2.24-5 5V7h-.5C5.12 7 4 8.12 4 9.5v9C4 19.88 5.12 21 6.5 21h11c1.39 0 2.5-1.12 2.5-2.5v-9C20 8.12 18.89 7 17.5 7zM13 14.73V17h-2v-2.27c-.59-.34-1-.99-1-1.73 0-1.1.9-2 2-2 1.11 0 2 .9 2 2 0 .74-.4 1.39-1 1.73zM15 7H9v-.25c0-1.66 1.35-3 3-3 1.66 0 3 1.34 3 3V7z"></path>
    </g>
  </svg>
));

const XBlueVerifiedIcon = memo(({ ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 22 22" aria-label="認証済みアカウント" role="img" {...props}>
    <g>
      <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"></path>
    </g>
  </svg>
));

const XGoldVerifiedIcon = memo(({ ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 22 22" aria-label="認証済みアカウント" role="img" {...props}>
    <g>
      <linearGradient gradientUnits="userSpaceOnUse" id="12-a" x1="4.411" x2="18.083" y1="2.495" y2="21.508">
        <stop offset="0" stop-color="#f4e72a"></stop>
        <stop offset=".539" stop-color="#cd8105"></stop>
        <stop offset=".68" stop-color="#cb7b00"></stop>
        <stop offset="1" stop-color="#f4ec26"></stop>
        <stop offset="1" stop-color="#f4e72a"></stop>
      </linearGradient>
      <linearGradient gradientUnits="userSpaceOnUse" id="12-b" x1="5.355" x2="16.361" y1="3.395" y2="19.133">
        <stop offset="0" stop-color="#f9e87f"></stop>
        <stop offset=".406" stop-color="#e2b719"></stop>
        <stop offset=".989" stop-color="#e2b719"></stop>
      </linearGradient><g clip-rule="evenodd" fill-rule="evenodd">
        <path d="M13.324 3.848L11 1.6 8.676 3.848l-3.201-.453-.559 3.184L2.06 8.095 3.48 11l-1.42 2.904 2.856 1.516.559 3.184 3.201-.452L11 20.4l2.324-2.248 3.201.452.559-3.184 2.856-1.516L18.52 11l1.42-2.905-2.856-1.516-.559-3.184zm-7.09 7.575l3.428 3.428 5.683-6.206-1.347-1.247-4.4 4.795-2.072-2.072z" fill="url(#12-a)"></path><path d="M13.101 4.533L11 2.5 8.899 4.533l-2.895-.41-.505 2.88-2.583 1.37L4.2 11l-1.284 2.627 2.583 1.37.505 2.88 2.895-.41L11 19.5l2.101-2.033 2.895.41.505-2.88 2.583-1.37L17.8 11l1.284-2.627-2.583-1.37-.505-2.88zm-6.868 6.89l3.429 3.428 5.683-6.206-1.347-1.247-4.4 4.795-2.072-2.072z" fill="url(#12-b)"></path>
        <path d="M6.233 11.423l3.429 3.428 5.65-6.17.038-.033-.005 1.398-5.683 6.206-3.429-3.429-.003-1.405.005.003z" fill="#d18800"></path>
      </g>
    </g>
  </svg>
));

const XGrayVerifiedIcon = memo(({ ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 22 22" aria-label="認証済みアカウント" role="img" {...props}>
    <g>
      <path clip-rule="evenodd" d="M12.05 2.056c-.568-.608-1.532-.608-2.1 0l-1.393 1.49c-.284.303-.685.47-1.1.455L5.42 3.932c-.832-.028-1.514.654-1.486 1.486l.069 2.039c.014.415-.152.816-.456 1.1l-1.49 1.392c-.608.568-.608 1.533 0 2.101l1.49 1.393c.304.284.47.684.456 1.1l-.07 2.038c-.027.832.655 1.514 1.487 1.486l2.038-.069c.415-.014.816.152 1.1.455l1.392 1.49c.569.609 1.533.609 2.102 0l1.393-1.49c.283-.303.684-.47 1.099-.455l2.038.069c.832.028 1.515-.654 1.486-1.486L18 14.542c-.015-.415.152-.815.455-1.099l1.49-1.393c.608-.568.608-1.533 0-2.101l-1.49-1.393c-.303-.283-.47-.684-.455-1.1l.068-2.038c.029-.832-.654-1.514-1.486-1.486l-2.038.07c-.415.013-.816-.153-1.1-.456zm-5.817 9.367l3.429 3.428 5.683-6.206-1.347-1.247-4.4 4.795-2.072-2.072z" fill="#829aab" fill-rule="evenodd"></path>
    </g>
  </svg>
)

// ユーザー情報表示コンポーネントをメモ化
const UserInfo = memo(({ user }: { user: any }) => {
  if (!user) return <h2 className="text-bold">ユーザーが見つかりませんでした。</h2>;
  if (user.__typename !== 'User') return <h2 className="text-bold">ユーザーが凍結されています。</h2>;
  
  return (
    <div className="flex gap-2">
      <Avatar size="lg" src={user.legacy.profile_image_url_https.replace("_normal.", ".")} />
      <div>
        <div className="flex items-center gap-0.5">
          <h2 className="text-lg text-bold">{user.legacy.name}</h2>
          {user.legacy.protected ? <XProtectIcon className="w-5 h-5" /> : null}
          {user.is_blue_verified && user.legacy.verified_type ? (
            (() => {
              switch (user.legacy.verified_type) {
                case 'Business':
                  return <XGoldVerifiedIcon className="w-5 h-5" />
                case 'Government':
                  return <XGrayVerifiedIcon className="w-5 h-5" />
                default:
                  return null
              }
            })()
          ) : (
            <XBlueVerifiedIcon className="w-5 h-5 fill-[#1d9bf0]" />
          )}
        </div>
        <p>@{user.legacy.screen_name}</p>
      </div>
    </div>
  );
});

export default function Home() {
  const [results, setResults] = useState<z.infer<typeof ResultsSchema>>();
  const [loading, setLoading] = useState(false);
  const client = useMemo(() => hc<AppType>('/api'), []);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty, isValid },
  } = useForm<z.infer<typeof TestQuerySchema>>({
    resolver: zodResolver(TestQuerySchema),
  });
  
  const onSubmit: SubmitHandler<z.infer<typeof TestQuerySchema>> = useCallback(async (data) => {
    setLoading(true);
    try {
      const results = await client.test.$get({
        query: data,
      });
      const jsonData = await results.json();
      setResults(jsonData);
    } catch (error) {
      console.error('Failed to fetch test results:', error);
      setResults(undefined);
    }
    setLoading(false);
  }, [client]);
  return (
    <div className="flex flex-col items-center justify-center my-12">
      <div className="flex flex-col items-center justify-center max-w-4xl w-full px-4 gap-8">
        <h1 className={`${montserrat.className} text-4xl`}>
          Is @{watch("screen_name") ? watch("screen_name") : 'Username'}<br />Shadowbanned on X (Twitter)?
        </h1>
        <Card className="dark:bg-neutral-800 w-full p-4">
          <CardBody>
            <form className="flex" onSubmit={handleSubmit(onSubmit)}>
              <Input radius="full" type="text" placeholder="X" variant="faded" labelPlacement="outside" startContent={<FaAt />} isInvalid={!!errors.screen_name} errorMessage={errors.screen_name?.message} {...register("screen_name")} />
              <Button isIconOnly radius="full" color="primary" type="submit" aria-label="Test" isLoading={loading} isDisabled={!isDirty || !isValid} className="ml-2">
                <FaMagnifyingGlass />
              </Button>
            </form>
          </CardBody>
        </Card>
        <Divider />
        <Card className="dark:bg-neutral-800 w-full">
          <CardHeader>
            {results ? <UserInfo user={results.user} /> : <h2 className="text-bold">シャドウバンとは？</h2>}
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
