// 특정 게임 카테고리에서 진행 중인 대회의 참가 스트리머 명단(팀 단위).
// 대회가 끝나면 이 객체에서 해당 categoryId 항목을 지우기만 하면 됨 —
// GameTopStreamers.tsx가 이 객체를 보고 탭을 조건부로 렌더링하므로,
// 여기서 지우면 관련 UI(탭 자체)가 자동으로 사라짐. 코드 수정 불필요.
export type FestivalRole = "팀장" | "코치" | "1티어" | "2티어";

export type FestivalMember = {
  channelId: string;
  name: string;
  role: FestivalRole;
};

export type FestivalTeam = {
  teamName: string;
  members: FestivalMember[];
};

export const ACTIVE_FESTIVALS: Record<
  string, // categoryId — 실제 이터널리턴 categoryId로 교체 필요 (지금은 자리표시자)
  {
    label: string; // 탭에 표시될 이름
    teams: FestivalTeam[];
  }
> = {
  Black_Survival_Eternal_Return: {
    label: "치지직 오픈컵",
    teams: [
      {
        teamName: "TEAM 1",
        members: [
          {
            channelId: "516937b5f85cbf2249ce31b0ad046b0f",
            name: "아오쿠모 린",
            role: "팀장",
          },
          {
            channelId: "130c9aaddbe784b39df85925ca384797",
            name: "한동그라미",
            role: "코치",
          },
          {
            channelId: "9f7467f5f3dfa4ea3dcef2962187d6a2",
            name: "미사키 하루",
            role: "1티어",
          },
          {
            channelId: "4d812b586ff63f8a2946e64fa860bbf5",
            name: "하나코 나나",
            role: "2티어",
          },
        ],
      },
      {
        teamName: "TEAM 2",
        members: [
          {
            channelId: "0de024a1ca4a64f1a23a95ff9eeee5a5",
            name: "임나은",
            role: "팀장",
          },
          {
            channelId: "06f0973dc983645a69d97a8ceab740eb",
            name: "리우리",
            role: "코치",
          },
          {
            channelId: "f638e750b76165c23e4f1530c166df1a",
            name: "츠밍",
            role: "1티어",
          },
          {
            channelId: "77599c8972b39e158c95e6a526272480",
            name: "람썬",
            role: "2티어",
          },
        ],
      },
      {
        teamName: "TEAM 3",
        members: [
          {
            channelId: "e112cad680f895d13769c43f56171b4a",
            name: "아구이뽀",
            role: "팀장",
          },
          {
            channelId: "988f7ce0360c7e5d4636c59d39838f3d",
            name: "메가재범",
            role: "코치",
          },
          {
            channelId: "8c0a733110437062e1a1381706312c80",
            name: "비행돼지",
            role: "1티어",
          },
          {
            channelId: "f4c0ddf59bb8e788e393cd5a8a1296b2",
            name: "콩콩",
            role: "2티어",
          },
        ],
      },
      {
        teamName: "TEAM 4",
        members: [
          {
            channelId: "8fd39bb8de623317de90654718638b10",
            name: "유즈하 리코",
            role: "팀장",
          },
          {
            channelId: "810579b4b9465c11d76e62c5cc2c0095",
            name: "KCW 케씨떱",
            role: "코치",
          },
          {
            channelId: "afff6e3cc8c1487bc4135bc896811dcc",
            name: "냐 미 Nyami",
            role: "1티어",
          },
          {
            channelId: "e2640468861f80d658873c25dc69e32b",
            name: "아 즈",
            role: "2티어",
          },
        ],
      },
      {
        teamName: "TEAM 5",
        members: [
          {
            channelId: "5f800579267362c952f76f3c6fe695b2",
            name: "금사향",
            role: "팀장",
          },
          {
            channelId: "1a4097d588f11db69a9e006f25e1eeff",
            name: "JUMO",
            role: "코치",
          },
          {
            channelId: "ec30975bd41d3179fe7734ddbf760acb",
            name: "이로나몽 치카",
            role: "1티어",
          },
          {
            channelId: "dcfd3c7cf3c05b41306a4cc249ad5c9f",
            name: "끠월마녀",
            role: "2티어",
          },
        ],
      },
      {
        teamName: "TEAM 6",
        members: [
          {
            channelId: "554e99695decc451d57788b1fd5d5c07",
            name: "배돈",
            role: "팀장",
          },
          {
            channelId: "4220f38359485fa2530392b36cb62e31",
            name: "지슥2",
            role: "코치",
          },
          {
            channelId: "b5da9cbcab300065236b4309ecaf19b7",
            name: "스나랑",
            role: "1티어",
          },
          {
            channelId: "6f1ae352c78027acf1bd92589fc44128",
            name: "두뭉",
            role: "2티어",
          },
        ],
      },
      {
        teamName: "TEAM 7",
        members: [
          {
            channelId: "29f20622463916fa48ad735057b145ce",
            name: "멋사",
            role: "팀장",
          },
          {
            channelId: "44c24ceb82d8a3b86e0d06c0cda6de83",
            name: "영만",
            role: "코치",
          },
          {
            channelId: "5ccef23c1d97d62b2b49457e9942e7e9",
            name: "레밀레기",
            role: "1티어",
          },
          {
            channelId: "d5e2e0c14dcca4c4b10c7c9633022f52",
            name: "치치 Planeta",
            role: "2티어",
          },
        ],
      },
      {
        teamName: "TEAM 8",
        members: [
          {
            channelId: "dc7fb0d085cfbbe90e11836e3b85b784",
            name: "강소연",
            role: "팀장",
          },
          {
            channelId: "63f96097d73a7a4acc33a56feea66fac",
            name: "루미널",
            role: "코치",
          },
          {
            channelId: "cffac6a96b6a2f625db9e6085c40d1c1",
            name: "이 선",
            role: "1티어",
          },
          {
            channelId: "952e7d21b36d75675894f97e4975bf9f",
            name: "이선생",
            role: "2티어",
          },
        ],
      },
    ],
  },
};
