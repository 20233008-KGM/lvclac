import {
  PUBLIC_OPERATOR_INFO,
  publicOperatorDetails,
  publicOperatorDisplayName,
} from '../config/operator'
import type { LegalPageKind } from '../config/routes'
import { PRIVACY_PATH, TERMS_PATH } from '../config/routes'
import { useLanguage, type Locale } from '../i18n'
import { PublicInfoShell } from './PublicInfoShell'

type PublicLegalKind = Extract<LegalPageKind, 'terms' | 'privacy'>

interface LegalTable {
  headers: string[]
  rows: string[][]
}

interface LegalSection {
  title: string
  paragraphs?: string[]
  table?: LegalTable
  links?: { label: string; href: string }[]
}

interface LegalDocument {
  title: string
  effective: string
  intro: string
  sections: LegalSection[]
}

function operatorSection(locale: Locale): LegalSection {
  return {
    title: locale === 'ko' ? '운영자 정보' : 'Operator information',
    table: {
      headers:
        locale === 'ko' ? ['항목', '내용'] : ['Item', 'Details'],
      rows: publicOperatorDetails(locale).map((detail) => [detail.label, detail.value]),
    },
  }
}

function buildDocuments(locale: Locale): Record<PublicLegalKind, LegalDocument> {
  const operatorName = publicOperatorDisplayName()
  const email = PUBLIC_OPERATOR_INFO.contactEmail

  if (locale === 'ko') {
    return {
      terms: {
        title: '이용약관',
        effective: '시행일: 2026년 8월 7일',
        intro:
          '본 약관은 LiqGuard 무료 선물 계산기와 관련 공개 정보 페이지의 이용 조건을 정합니다.',
        sections: [
          operatorSection(locale),
          {
            title: '1. 서비스의 성격과 범위',
            paragraphs: [
              'LiqGuard는 사용자가 입력한 계좌 평가금액, 가격, 계약수와 증거금 정보를 바탕으로 예상 청산가, 증거금 여유, 레버리지와 주문 시뮬레이션 값을 계산하는 보조 도구입니다.',
              '서비스는 금융투자상품에 대한 투자자문, 주문 실행, 계좌관리, 거래 권유 또는 수익 보장을 제공하지 않습니다.',
            ],
          },
          {
            title: '2. 계산 결과의 확인',
            paragraphs: [
              '거래소, 증권사, 브로커, 상품과 계좌별로 증거금 산식, 수수료, 반올림, 강제청산 시점과 위험관리 정책이 다를 수 있습니다.',
              '이용자는 실제 거래 전에 거래소·증권사 공식 자료와 본인의 거래 화면에서 결과를 다시 확인해야 하며, 최종 거래 판단과 책임은 이용자에게 있습니다.',
            ],
          },
          {
            title: '3. 기기 내 저장',
            paragraphs: [
              '이용자가 로컬 저장을 선택하면 계산기 입력값이 현재 브라우저의 localStorage에 저장됩니다. 해당 값은 LiqGuard 계정이나 서버 데이터베이스에 저장되지 않습니다.',
              '공용 기기, 브라우저 확장 프로그램, 악성 프로그램, 기기 분실, 브라우저 데이터 삭제 또는 저장소 오류로 데이터가 노출되거나 사라질 수 있습니다. 중요한 계좌 정보의 별도 보관 수단으로 사용해서는 안 됩니다.',
            ],
          },
          {
            title: '4. 광고·분석 및 외부 서비스',
            paragraphs: [
              '무료 서비스 운영과 품질 개선을 위해 Vercel Web Analytics, Google Analytics 4 및 Google AdSense를 사용할 수 있습니다.',
              '광고주의 상품·서비스와 외부 링크는 각 제공자가 책임지며, LiqGuard가 해당 상품·서비스의 품질이나 적합성을 보증하지 않습니다.',
            ],
          },
          {
            title: '5. 지식재산권',
            paragraphs: [
              '서비스의 프로그램, 화면 구성, 문서와 자체 작성 콘텐츠에 관한 권리는 관련 법령 또는 별도 라이선스에 따라 운영자에게 귀속됩니다.',
              '이용자는 개인적인 계산과 검토 목적으로 서비스를 사용할 수 있으나, 서비스 전체를 복제·재판매하거나 출처를 오인하게 해서는 안 됩니다.',
            ],
          },
          {
            title: '6. 서비스 변경과 중단',
            paragraphs: [
              '운영자는 정확성, 보안, 법령 또는 운영상 필요에 따라 서비스와 계산 방식을 변경하거나 일시 중단할 수 있습니다. 중요한 변경은 가능한 범위에서 서비스에 안내합니다.',
            ],
          },
          {
            title: '7. 책임 제한',
            paragraphs: [
              '법령이 허용하는 범위에서 운영자는 서비스 이용, 계산 차이, 저장 데이터 손실, 외부 서비스 장애 또는 투자 판단으로 발생한 직접·간접 손해와 기회 손실에 책임을 부담하지 않습니다.',
              '운영자의 고의 또는 중대한 과실로 인한 책임까지 배제하는 의미는 아닙니다.',
            ],
          },
          {
            title: '8. 준거법과 분쟁',
            paragraphs: [
              `본 약관은 대한민국 법령을 따릅니다. 서비스 관련 문의 또는 분쟁은 먼저 ${email}로 협의를 요청할 수 있으며, 해결되지 않는 경우 관계 법령이 정한 관할 법원 또는 분쟁조정 절차를 따릅니다.`,
            ],
          },
          {
            title: '9. 약관 변경',
            paragraphs: [
              '약관이 변경되면 시행일과 주요 변경 내용을 이 페이지에 표시합니다. 변경된 약관은 표시된 시행일부터 적용됩니다.',
            ],
          },
        ],
      },
      privacy: {
        title: '개인정보처리방침',
        effective: '시행일: 2026년 8월 7일',
        intro:
          `${operatorName}는 LiqGuard 공개 서비스에서 처리되는 정보와 이용자의 권리를 다음과 같이 안내합니다. 공개판은 회원가입·로그인·클라우드 저장을 제공하지 않습니다.`,
        sections: [
          operatorSection(locale),
          {
            title: '1. 처리 항목·목적·보유기간',
            table: {
              headers: ['구분', '처리 항목', '목적', '보유기간·삭제'],
              rows: [
                [
                  '기기 내 저장',
                  '계좌 평가금액, 가격, 계약수, 증거금, 상품 설정 등 이용자가 입력한 계산값',
                  '다음 방문 시 계산기 입력 복원',
                  '이용자가 입력값 비우기를 실행하거나 브라우저 사이트 데이터를 삭제할 때까지',
                ],
                [
                  '필수 설정',
                  '언어·용어 프리셋, 면책 확인, 로컬 저장 선택, 개인정보·쿠키 선택',
                  '이용자 설정 유지와 반복 안내 방지',
                  '설정별 localStorage 삭제 또는 브라우저 사이트 데이터 삭제 시까지',
                ],
                [
                  '지역 쿠키',
                  '접속 국가 코드',
                  '초기 언어 선택 보조',
                  '브라우저 쿠키에 최대 30일',
                ],
                [
                  '호스팅 로그',
                  '접속 시각, IP 주소, 요청 URL, 브라우저·기기 정보, 오류·보안 로그',
                  '서비스 제공, 보안, 장애 대응과 부정 이용 방지',
                  'Vercel의 서비스 운영 및 보안 정책에 따른 기간',
                ],
                [
                  'Vercel Web Analytics',
                  '이벤트 시각, 페이지 URL·경로, 필터링된 쿼리, 리퍼러, 국가·지역, OS·브라우저·기기 종류, 스크립트 버전',
                  '익명·집계 방문 통계와 서비스 개선',
                  '방문자 세션 식별 정보는 24시간 후 폐기되며 집계 데이터는 Vercel 정책에 따른 기간',
                ],
                [
                  'Google Analytics 4',
                  '쿠키·기기 식별 정보, IP에서 파생된 지역, 페이지·이용 이벤트',
                  '이용 현황 분석과 서비스 개선',
                  'GA4 이벤트 데이터 보유기간 14개월 설정을 기준으로 하며 동의 철회 후 추가 수집 중단',
                ],
                [
                  'Google AdSense',
                  '광고 쿠키·기기 식별자, IP 주소, 광고 노출·클릭과 상호작용 정보',
                  '광고 제공, 빈도 제한, 측정, 부정 트래픽 방지와 맞춤 광고',
                  'Google 정책과 이용자의 광고·쿠키 선택에 따른 기간',
                ],
              ],
            },
          },
          {
            title: '2. 계산기 입력값의 처리',
            paragraphs: [
              '계산기 입력값은 이용자가 로컬 저장을 선택한 경우에만 해당 브라우저의 localStorage에 저장됩니다. 운영자는 이 값을 서버로 전송하거나 판매하지 않습니다.',
              '입력값 비우기는 저장된 계산기 입력도 함께 삭제합니다. 브라우저의 사이트 데이터 삭제 기능을 이용해 언어·동의 설정을 포함한 모든 로컬 데이터를 제거할 수도 있습니다.',
            ],
          },
          {
            title: '3. 처리위탁 및 외부 제공자',
            table: {
              headers: ['수탁자·제공자', '업무', '처리 정보'],
              rows: [
                ['Vercel Inc.', '웹 호스팅, 전송, 보안 로그, Web Analytics', '접속·기기·집계 이용 정보'],
                ['Google LLC', 'GA4 이용 분석, AdSense 광고와 동의 관리', '쿠키·기기·접속·이용·광고 정보'],
              ],
            },
          },
          {
            title: '4. 개인정보의 국외 이전',
            table: {
              headers: ['이전받는 자', '국가·시점·방법', '목적', '보유기간'],
              rows: [
                [
                  'Vercel Inc.',
                  '미국 및 Vercel 인프라 운영 국가 · 서비스 접속 시 암호화된 네트워크 전송',
                  '호스팅, 보안, 장애 대응, 익명 방문 통계',
                  'Vercel의 서비스·보안·분석 정책에 따른 기간',
                ],
                [
                  'Google LLC',
                  '미국 및 Google 데이터센터 운영 국가 · 동의 후 암호화된 네트워크 전송',
                  'GA4 분석, AdSense 광고 제공·측정·부정 이용 방지',
                  'GA4 설정 및 Google 광고·개인정보 정책에 따른 기간',
                ],
              ],
            },
          },
          {
            title: '5. 쿠키와 선택권',
            paragraphs: [
              'Google 태그는 기본적으로 광고·분석 저장을 거부 상태로 시작합니다. 적용 지역에서는 Google 인증 CMP를 통해 선택을 받은 뒤 GA4 측정 여부를 결정하고, AdSense는 선택에 따라 맞춤·비맞춤·제한 광고 중 허용되는 방식으로 요청할 수 있습니다.',
              'Google과 광고 파트너는 이용자의 이 사이트 또는 다른 웹사이트 방문 기록을 바탕으로 광고를 제공하기 위해 광고 쿠키를 사용할 수 있습니다. 이용자는 Google 광고 설정에서 맞춤 광고를 해제할 수 있습니다.',
              '푸터의 개인정보·쿠키 설정에서 선택을 변경하거나 철회할 수 있습니다. 선택 기능을 거부해도 계산기, 수식, 가이드와 기기 내 저장 기능은 사용할 수 있습니다.',
            ],
            links: [
              {
                label: 'Google 광고 설정',
                href: 'https://adssettings.google.com/',
              },
              {
                label: 'Google Analytics 차단 브라우저 부가기능',
                href: 'https://tools.google.com/dlpage/gaoptout',
              },
            ],
          },
          {
            title: '6. 정보주체의 권리와 행사방법',
            paragraphs: [
              `개인정보 처리에 관한 열람, 정정, 삭제, 처리정지 또는 문의는 ${email}로 요청할 수 있습니다. 본인 확인이 필요한 요청에는 권리 보호를 위해 추가 확인을 요청할 수 있습니다.`,
              '브라우저에 저장된 값은 입력값 비우기 또는 브라우저 사이트 데이터 삭제로 직접 제거할 수 있습니다.',
            ],
          },
          {
            title: '7. 안전성 확보조치',
            paragraphs: [
              '운영자는 전송구간 암호화(HTTPS), 접근권한 최소화, 비밀정보의 서버 환경변수 분리, 보안 업데이트와 로그 점검 등 서비스 규모에 적합한 보호조치를 적용합니다.',
            ],
          },
          {
            title: '8. 개인정보 보호책임자와 구제방법',
            paragraphs: [
              `개인정보 문의: ${email}`,
              '개인정보 침해에 대한 상담이나 분쟁조정은 개인정보침해신고센터(국번 없이 118), 개인정보분쟁조정위원회(1833-6972), 경찰청 또는 관계 기관에 요청할 수 있습니다.',
            ],
            links: [
              {
                label: '개인정보 포털',
                href: 'https://www.privacy.go.kr/',
              },
              {
                label: '개인정보분쟁조정위원회',
                href: 'https://www.kopico.go.kr/',
              },
            ],
          },
          {
            title: '9. 처리방침 변경',
            paragraphs: [
              '처리방침이 변경되면 시행일과 변경 내용을 이 페이지에 표시합니다. 광고·분석 도구, 저장 방식 또는 운영 주체가 바뀌면 관련 내용을 함께 갱신합니다.',
            ],
          },
        ],
      },
    }
  }

  return {
    terms: {
      title: 'Terms of Use',
      effective: 'Effective: August 7, 2026',
      intro:
        'These terms govern the free LiqGuard futures calculator and its public information pages.',
      sections: [
        operatorSection(locale),
        {
          title: '1. Service scope',
          paragraphs: [
            'LiqGuard estimates liquidation price, margin headroom, leverage, and order-simulation results from values entered by the user.',
            'It does not provide investment advice, execute orders, manage accounts, recommend trades, or guarantee returns.',
          ],
        },
        {
          title: '2. Verification of results',
          paragraphs: [
            'Exchanges, brokers, products, and accounts may use different margin formulas, fees, rounding, liquidation timing, and risk policies.',
            'You must verify results against official exchange or broker information before trading. You remain responsible for every trading decision.',
          ],
        },
        {
          title: '3. On-device storage',
          paragraphs: [
            'If you select local saving, calculator inputs are stored in this browser localStorage and are not stored in a LiqGuard account or server database.',
            'Stored values may be exposed or lost on shared devices, through browser extensions or malware, device loss, browser-data deletion, or storage errors.',
          ],
        },
        {
          title: '4. Advertising, analytics, and external services',
          paragraphs: [
            'We may use Vercel Web Analytics, Google Analytics 4, and Google AdSense to operate and improve the free service.',
            'Advertisers and external sites are responsible for their own products and services. LiqGuard does not endorse them.',
          ],
        },
        {
          title: '5. Intellectual property',
          paragraphs: [
            'Software, interface design, documentation, and original content are protected by applicable rights and licenses.',
            'You may use the service for personal calculation and review, but may not reproduce or resell the service as a whole or misrepresent its source.',
          ],
        },
        {
          title: '6. Changes and availability',
          paragraphs: [
            'We may change or temporarily suspend the service or calculation methods for accuracy, security, legal, or operational reasons.',
          ],
        },
        {
          title: '7. Limitation of liability',
          paragraphs: [
            'To the extent permitted by law, the operator is not liable for direct or indirect loss, lost opportunities, calculation differences, local-data loss, external-service failures, or investment decisions.',
            'This does not exclude liability that cannot legally be excluded, including intentional misconduct or gross negligence.',
          ],
        },
        {
          title: '8. Governing law and disputes',
          paragraphs: [
            `These terms are governed by the laws of the Republic of Korea. Contact ${email} first for service disputes; unresolved matters follow applicable courts or dispute-resolution procedures.`,
          ],
        },
        {
          title: '9. Changes to these terms',
          paragraphs: [
            'We will show the effective date and material changes on this page. Updated terms apply from the displayed effective date.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      effective: 'Effective: August 7, 2026',
      intro:
        `${operatorName} explains below how information is handled in the public LiqGuard service. The public version has no account, sign-in, or cloud storage.`,
      sections: [
        operatorSection(locale),
        {
          title: '1. Data, purposes, and retention',
          table: {
            headers: ['Category', 'Data', 'Purpose', 'Retention or deletion'],
            rows: [
              [
                'On-device inputs',
                'Account equity, prices, contracts, margin, and instrument settings entered by you',
                'Restore calculator inputs on a later visit',
                'Until you clear inputs or delete browser site data',
              ],
              [
                'Required preferences',
                'Language, glossary preset, disclaimer acknowledgement, local-save and privacy choices',
                'Keep settings and avoid repeating notices',
                'Until the related localStorage value or browser site data is deleted',
              ],
              [
                'Region cookie',
                'Country code',
                'Initial language selection',
                'Up to 30 days',
              ],
              [
                'Hosting logs',
                'Access time, IP address, URL, browser, device, error, and security logs',
                'Delivery, security, troubleshooting, and abuse prevention',
                'Under Vercel operational and security retention policies',
              ],
              [
                'Vercel Web Analytics',
                'Event time, page URL and path, filtered query, referrer, region, OS, browser, device type, and script version',
                'Anonymous aggregate traffic measurement',
                'Visitor-session identification is discarded after 24 hours; aggregate data follows Vercel policy',
              ],
              [
                'Google Analytics 4',
                'Cookies or device identifiers, IP-derived region, pages, and usage events',
                'Usage analysis and product improvement',
                'Configured for 14-month event-data retention; new collection stops after withdrawal',
              ],
              [
                'Google AdSense',
                'Advertising cookies or identifiers, IP address, impressions, clicks, and interactions',
                'Ad delivery, frequency control, measurement, invalid-traffic prevention, and personalization',
                'Under Google policies and your advertising or cookie choices',
              ],
            ],
          },
        },
        {
          title: '2. Calculator inputs',
          paragraphs: [
            'Calculator inputs are stored only in this browser localStorage when you choose local saving. We do not transmit or sell those inputs.',
            'Clearing calculator inputs also removes the saved calculator draft. Browser controls can remove all local LiqGuard data.',
          ],
        },
        {
          title: '3. Processors and service providers',
          table: {
            headers: ['Provider', 'Service', 'Information'],
            rows: [
              ['Vercel Inc.', 'Hosting, delivery, security logs, Web Analytics', 'Access, device, and aggregate usage data'],
              ['Google LLC', 'GA4 analytics, AdSense advertising, consent management', 'Cookie, device, access, usage, and ad data'],
            ],
          },
        },
        {
          title: '4. International transfers',
          table: {
            headers: ['Recipient', 'Country, timing, and method', 'Purpose', 'Retention'],
            rows: [
              [
                'Vercel Inc.',
                'United States and infrastructure locations; encrypted network transfer when the service is accessed',
                'Hosting, security, troubleshooting, and anonymous traffic measurement',
                'Under Vercel service, security, and analytics policies',
              ],
              [
                'Google LLC',
                'United States and Google data-center locations; encrypted network transfer after the applicable choice',
                'GA4 analytics and AdSense delivery, measurement, and invalid-traffic prevention',
                'Under GA4 settings and Google advertising and privacy policies',
              ],
            ],
          },
        },
        {
          title: '5. Cookies and choices',
          paragraphs: [
            'Google consent defaults begin in a denied state. Where required, a choice through a Google-certified CMP controls GA4 measurement, while AdSense may request an eligible personalized, non-personalized, or limited ad based on that choice.',
            'Google and its advertising partners may use advertising cookies to serve ads based on visits to this site or other websites. You can opt out of personalized advertising through Google Ads Settings.',
            'You can change or withdraw your choice through Privacy and cookie settings in the footer. Denying optional use does not disable the calculator, formulas, guide, or on-device saving.',
          ],
          links: [
            { label: 'Google Ads Settings', href: 'https://adssettings.google.com/' },
            {
              label: 'Google Analytics opt-out browser add-on',
              href: 'https://tools.google.com/dlpage/gaoptout',
            },
          ],
        },
        {
          title: '6. Your rights',
          paragraphs: [
            `Contact ${email} to request access, correction, deletion, restriction, or information about processing. We may request reasonable verification to protect your rights.`,
            'You can directly remove browser-stored values by clearing calculator inputs or browser site data.',
          ],
        },
        {
          title: '7. Security measures',
          paragraphs: [
            'We use HTTPS, least-privilege access, separation of secrets into server environment variables, security updates, and log review appropriate to the service.',
          ],
        },
        {
          title: '8. Privacy contact and remedies',
          paragraphs: [
            `Privacy contact: ${email}`,
            'Korean users may also contact the Personal Information Infringement Report Center, the Personal Information Dispute Mediation Committee, police, or other competent authorities.',
          ],
          links: [
            { label: 'Korean Privacy Portal', href: 'https://www.privacy.go.kr/' },
            { label: 'Dispute Mediation Committee', href: 'https://www.kopico.go.kr/' },
          ],
        },
        {
          title: '9. Policy changes',
          paragraphs: [
            'We will display the effective date and material changes here. We will update this policy when storage, analytics, advertising, or the operator changes.',
          ],
        },
      ],
    },
  }
}

export function PublicLegalPage({ kind }: { kind: PublicLegalKind }) {
  const { locale } = useLanguage()
  const page = buildDocuments(locale)[kind]
  const homeLabel = locale === 'ko' ? '계산기로 돌아가기' : 'Back to calculator'
  const eyebrow = locale === 'ko' ? 'LiqGuard · 법적 고지' : 'LiqGuard · Legal'
  const activePath = kind === 'terms' ? TERMS_PATH : PRIVACY_PATH

  return (
    <PublicInfoShell
      activePath={activePath}
      tone="legal"
      eyebrow={eyebrow}
      title={page.title}
      lead={page.intro}
    >
      <div className="public-legal-document">
        <p className="public-legal-effective">{page.effective}</p>
        <div className="public-legal-sections">
            {page.sections.map((section) => (
              <section key={section.title}>
                <h2>{section.title}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.table && (
                  <div className="public-legal-table-wrap">
                    <table className="public-legal-table">
                      <thead>
                        <tr>
                          {section.table.headers.map((header) => (
                            <th key={header} scope="col">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.rows.map((row) => (
                          <tr key={row.join('|')}>
                            {row.map((cell, index) =>
                              index === 0 ? (
                                <th key={cell} scope="row">
                                  {cell}
                                </th>
                              ) : (
                                <td key={`${index}-${cell}`}>{cell}</td>
                              ),
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {section.links && (
                  <ul className="public-legal-links">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <a href={link.href} target="_blank" rel="noopener noreferrer">
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
        </div>
        <a className="btn btn-primary public-legal-home" href="/">
          {homeLabel}
        </a>
      </div>
    </PublicInfoShell>
  )
}
