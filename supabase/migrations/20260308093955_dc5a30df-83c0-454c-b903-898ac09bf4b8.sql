
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS school TEXT
  CHECK (school IN ('naturens-vag','precisionsodlaren','hackaren','traditionalisten'));

ALTER TABLE public.swedish_crop_tips
  ADD COLUMN IF NOT EXISTS school_naturens_vag_tip TEXT,
  ADD COLUMN IF NOT EXISTS school_precisionsodlaren_tip TEXT,
  ADD COLUMN IF NOT EXISTS school_hackaren_tip TEXT,
  ADD COLUMN IF NOT EXISTS school_traditionalisten_tip TEXT;

UPDATE public.swedish_crop_tips SET
  school_naturens_vag_tip = 'Kallså direkt på friland i maj–juni. Välj härdiga sorter som Stupice eller Siberian. Glöm förkultivering – naturen klarar det.',
  school_precisionsodlaren_tip = 'Förkultivera 8–10 veckor innan plantering. San Marzano för passata, Sungold för balkongen. Mät jordens pH och gödsla med kalium under blomning.',
  school_hackaren_tip = 'Köp färdiga plantor i maj och spara 6 veckor. Använd vallgravar runt plantorna för självvattning. Toppa vid 4–5 klasar för större frukter.',
  school_traditionalisten_tip = 'Klassisk förkultivering inomhus i mars. Härda av plantorna 1–2 veckor innan utplantering. Välj gamla beprövade sorter som Moneymaker.'
WHERE crop_name = 'Tomat';

UPDATE public.swedish_crop_tips SET
  school_naturens_vag_tip = 'Direktså på hösten (oktober) för kallgroning – de klarar sig själva och gror när de är redo på våren.',
  school_precisionsodlaren_tip = 'Förbered sängen med djupluckrad sandblandad jord. Tillsätt mineraler. Exakta sådjup 1 cm. Gallra strikt till 5 cm för raka, tjocka morötter.',
  school_hackaren_tip = 'Blanda morotsfrön med sand för jämn spridning. Täck med fiberduk direkt – halverar gallringsarbetet och håller morotsflugorna borta.',
  school_traditionalisten_tip = 'Direktså i maj på klassiskt vis. Gallra i omgångar och ät de tidiga tunna morötterna som en delikatess.'
WHERE crop_name = 'Morot';

UPDATE public.swedish_crop_tips SET
  school_naturens_vag_tip = 'Strö ut frön löst och låt dem ligga – de gror när de vill. Låt gamla plantor självså för ett evigt salladssäng.',
  school_precisionsodlaren_tip = 'Planera successionsodling var 14:e dag. Välj värmekänsliga sorter för vår/höst, bolmningståliga för sommar. Täck med skuggnät i juli.',
  school_hackaren_tip = 'Köp en levande salladskruka från mataffären, dela upp och plantera ut – 10x fler plantor för 30 kr. Skörda yttre blad för evig leverans.',
  school_traditionalisten_tip = 'Direktså i rader med lagom avstånd. Vattna regelbundet. Skörd när plantorna är handflatsbreda.'
WHERE crop_name = 'Sallad';
