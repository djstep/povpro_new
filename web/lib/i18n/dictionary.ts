import type { Locale } from './config';

export type Dictionary = {
  nav: {
    home: string;
    machining: string;
    intelligentSystems: string;
    intelligentSystemsShort: string;
    services: string;
    contacts: string;
    reviews: string;
    products: string;
    diesAndMolds: string;
    shafts: string;
    gearsAndPinions: string;
    gearCutting: string;
    grinding: string;
    milling: string;
    turning: string;
    coordinateBoring: string;
    edm: string;
    slotting: string;
    dieCastingSalesRepair: string;
    heatTreatment: string;
    spectralAnalysis: string;
    forgePressRepair: string;
    frictionProducts: string;
    frictionTechnicalSpecs: string;
    more: string;
    fullMenu: string;
    quickNav: string;
  };
  header: {
    openMenu: string;
    closeMenu: string;
    orderShort: string;
    requestQuote: string;
  };
  footer: {
    tagline: string;
    navigation: string;
    products: string;
    contacts: string;
    copyright: string;
    privacyPolicy: string;
  };
  common: {
    page: string;
    companyName: string;
    cityAddress: string;
  };
  forms: {
    requiredFields: string;
    submit: string;
    submitOrder: string;
    sending: string;
    success: string;
    successTitle: string;
    successBody: string;
    name: string;
    company: string;
    phone: string;
    email: string;
    message: string;
    orderComments: string;
    attachFile: string;
    dropHint: string;
    formatsHint: string;
    fileTooLarge: string;
    attachments: string;
    removeFile: string;
    consentPrefix: string;
    privacyLink: string;
    consentPrivacy: string;
    consentPersonalData: string;
    consentError: string;
    nameRequired: string;
    phoneRequired: string;
    phoneInvalid: string;
    emailRequired: string;
    orderTitle: string;
    orderLead1: string;
    orderLead2: string;
    namePlaceholder: string;
    companyPlaceholder: string;
    phonePlaceholder: string;
    emailPlaceholder: string;
    messagePlaceholder: string;
  };
};

const ru: Dictionary = {
  nav: {
    home: 'Главная',
    machining: 'Мехобработка',
    intelligentSystems: 'Интеллектуальные системы',
    intelligentSystemsShort: 'ИРТ',
    services: 'Услуги',
    contacts: 'Контакты',
    reviews: 'Отзывы',
    products: 'Продукция',
    diesAndMolds: 'Штампы и пресс-формы',
    shafts: 'Валы',
    gearsAndPinions: 'Шестерни и зубчатые колеса',
    gearCutting: 'Зуборезные работы',
    grinding: 'Шлифовальные работы',
    milling: 'Фрезерные работы',
    turning: 'Токарные работы',
    coordinateBoring: 'Координатно-расточные работы',
    edm: 'Электроэрозионные работы',
    slotting: 'Долбежные работы',
    dieCastingSalesRepair: 'Продажа и ремонт МЛД',
    heatTreatment: 'Термообработка',
    spectralAnalysis: 'Спектральный анализ металла',
    forgePressRepair: 'Ремонт КПО',
    frictionProducts: 'Наши фрикционные изделия',
    frictionTechnicalSpecs: 'Технические условия',
    more: 'Ещё',
    fullMenu: 'Полное меню',
    quickNav: 'Быстрая навигация',
  },
  header: {
    openMenu: 'Открыть меню',
    closeMenu: 'Закрыть меню',
    orderShort: 'Заказ',
    requestQuote: 'Запросить расчет',
  },
  footer: {
    tagline:
      'Промышленные фрикционные изделия. Лидер отрасли в обработке безасбестовых материалов.',
    navigation: 'Навигация',
    products: 'Продукция',
    contacts: 'Контакты',
    copyright: 'Промышленное производство и инжиниринг. Все права защищены.',
    privacyPolicy: 'Политика конфиденциальности',
  },
  common: {
    page: 'Страница',
    companyName: 'ППО №3',
    cityAddress: 'г. Тольятти, ул. Окраинная, 24',
  },
  forms: {
    requiredFields: '* Обязательные поля',
    submit: 'Отправить запрос',
    submitOrder: 'Оформить заявку',
    sending: 'Отправка…',
    success: 'Запрос отправлен. Мы свяжемся с вами в ближайшее время.',
    successTitle: 'Заявка отправлена',
    successBody:
      'Специалист свяжется с вами в ближайшее время для уточнения деталей заказа.',
    name: 'Имя',
    company: 'Компания',
    phone: 'Телефон',
    email: 'E-mail',
    message: 'Описание задачи',
    orderComments: 'Комментарии к заказу',
    attachFile: 'Прикрепить файл',
    dropHint: 'Перетащите файлы сюда или нажмите для выбора',
    formatsHint: 'Поддерживаемые форматы: PDF, DWG, DOCX, ZIP (до 20МБ)',
    fileTooLarge: 'превышает 20 МБ',
    attachments: 'Файлы (чертежи, спецификации)',
    removeFile: 'Удалить',
    consentPrefix: 'Я согласен на обработку персональных данных в соответствии с',
    privacyLink: 'политикой конфиденциальности',
    consentPrivacy: 'Я согласен с',
    consentPersonalData: 'Я даю согласие на',
    consentError: 'Подтвердите согласие с политикой и обработкой персональных данных',
    nameRequired: 'Укажите имя',
    phoneRequired: 'Укажите телефон',
    phoneInvalid: 'Введите телефон полностью: +7 (___) ___-__-__',
    emailRequired: 'Укажите email',
    orderTitle: 'Сделать заказ',
    orderLead1:
      'Примем заказ на изготовление металлоизделий по чертежам, на обработку металла в кратчайшие сроки.',
    orderLead2:
      'Заполните форму для того, чтобы наши специалисты смогли сделать вам полный расчет стоимости продукции. Прикрепите чертежи, технические условия, сопроводительную документацию.',
    namePlaceholder: 'Введите ваше имя',
    companyPlaceholder: 'Название компании',
    phonePlaceholder: '+7 (___) ___-__-__',
    emailPlaceholder: 'email@example.com',
    messagePlaceholder: 'Опишите детали вашего заказа...',
  },
};

const en: Dictionary = {
  nav: {
    home: 'Home',
    machining: 'Machining',
    intelligentSystems: 'Intelligent Systems',
    intelligentSystemsShort: 'IRT',
    services: 'Services',
    contacts: 'Contacts',
    reviews: 'Reviews',
    products: 'Products',
    diesAndMolds: 'Dies & Molds',
    shafts: 'Shafts',
    gearsAndPinions: 'Gears & Pinions',
    gearCutting: 'Gear Cutting',
    grinding: 'Grinding',
    milling: 'Milling',
    turning: 'Turning',
    coordinateBoring: 'Coordinate Boring',
    edm: 'EDM Services',
    slotting: 'Slotting',
    dieCastingSalesRepair: 'Die Casting Sales & Repair',
    heatTreatment: 'Heat Treatment',
    spectralAnalysis: 'Metal Spectral Analysis',
    forgePressRepair: 'Forge & Press Repair',
    frictionProducts: 'Our Friction Products',
    frictionTechnicalSpecs: 'Technical Specifications',
    more: 'More',
    fullMenu: 'Full menu',
    quickNav: 'Quick navigation',
  },
  header: {
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    orderShort: 'Order',
    requestQuote: 'Request a Quote',
  },
  footer: {
    tagline:
      'Industrial friction products. Industry leader in non-asbestos material processing.',
    navigation: 'Navigation',
    products: 'Products',
    contacts: 'Contacts',
    copyright: 'Industrial manufacturing and engineering. All rights reserved.',
    privacyPolicy: 'Privacy Policy',
  },
  common: {
    page: 'Page',
    companyName: 'PPO №3',
    cityAddress: '24 Okrainnaya St., Togliatti',
  },
  forms: {
    requiredFields: '* Required fields',
    submit: 'Submit Request',
    submitOrder: 'Submit Order',
    sending: 'Sending…',
    success: 'Your request has been submitted. We will contact you shortly.',
    successTitle: 'Order request submitted',
    successBody: 'A specialist will contact you shortly to clarify the order details.',
    name: 'Name',
    company: 'Company',
    phone: 'Phone',
    email: 'Email',
    message: 'Project Description',
    orderComments: 'Order comments',
    attachFile: 'Attach a file',
    dropHint: 'Drag and drop files here or click to browse',
    formatsHint: 'Supported formats: PDF, DWG, DOCX, ZIP (up to 20 MB)',
    fileTooLarge: 'exceeds 20 MB',
    attachments: 'Files (drawings, specifications)',
    removeFile: 'Remove',
    consentPrefix: 'I agree to the processing of personal data in accordance with the',
    privacyLink: 'privacy policy',
    consentPrivacy: 'I agree to the',
    consentPersonalData: 'I consent to',
    consentError: 'Please confirm agreement with the privacy policy and personal data processing',
    nameRequired: 'Please enter your name',
    phoneRequired: 'Please enter your phone number',
    phoneInvalid: 'Enter the full phone number: +7 (___) ___-__-__',
    emailRequired: 'Please enter your email',
    orderTitle: 'Place an Order',
    orderLead1:
      'We accept orders for metal parts manufactured to drawings and for metalworking with short lead times.',
    orderLead2:
      'Complete the form so our specialists can prepare a full cost estimate. Attach drawings, technical specifications, and supporting documentation.',
    namePlaceholder: 'Enter your name',
    companyPlaceholder: 'Company name',
    phonePlaceholder: '+7 (___) ___-__-__',
    emailPlaceholder: 'email@example.com',
    messagePlaceholder: 'Describe your order details...',
  },
};

const DICTIONARIES: Record<Locale, Dictionary> = { ru, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/** Map site paths to dictionary nav label keys. */
const NAV_HREF_LABELS: Record<string, keyof Dictionary['nav']> = {
  '/': 'home',
  '/mekhanicheskaya-obrabotka': 'machining',
  '/irt': 'intelligentSystems',
  '/metalloobrabotka': 'services',
  '/contacts': 'contacts',
  '/otzyvy-o-ppo': 'reviews',
  '/proizvodstvo_detalej': 'products',
  '/proizvodstvo-press-form-i-shtampov': 'diesAndMolds',
  '/izgotovlenie-valov': 'shafts',
  '/izgotovlenie-shesteren-i-zubchatyh-koles': 'gearsAndPinions',
  '/zuboreznye-raboty': 'gearCutting',
  '/shlifovalnye-raboty': 'grinding',
  '/frezernye-raboty': 'milling',
  '/tokarnye-raboty': 'turning',
  '/koordinatno-rastochnye-raboty': 'coordinateBoring',
  '/elektroerozionnye-raboty': 'edm',
  '/dolbezhnye-raboty': 'slotting',
  '/mashiny-dlya-litya-pod-davleniem': 'dieCastingSalesRepair',
  '/termoobrabotka': 'heatTreatment',
  '/termoobrabotka#spektralnyy-analiz': 'spectralAnalysis',
  '/remont-kuznechno-pressovogo-oborudovaniya': 'forgePressRepair',
  '/frikcionnye-nakladki/nashi-izdeliya': 'frictionProducts',
  '/frikcionnye-nakladki/tu': 'frictionTechnicalSpecs',
};

export function navLabelForHref(
  href: string,
  dictionary: Dictionary,
  fallback: string,
): string {
  const key = NAV_HREF_LABELS[href];
  return key ? dictionary.nav[key] : fallback;
}
