// Copyright (c) 2020 Jarret Dyrbye
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php

// info gleamed from Wikipedia

const FIAT = {
 "AED": {
  "code": "AED",
  "countries": "United Arab Emirates",
  "decimals": 2,
  "iso_num": 784,
  "name": "United Arab Emirates dirham",
  "symbol": "د.إ"
 },
 "AFN": {
  "code": "AFN",
  "countries": "Afghanistan",
  "decimals": 2,
  "iso_num": 971,
  "name": "Afghan afghani",
  "symbol": ""
 },
 "ALL": {
  "code": "ALL",
  "countries": "Albania",
  "decimals": 2,
  "iso_num": 8,
  "name": "Albanian lek",
  "symbol": "L"
 },
 "AMD": {
  "code": "AMD",
  "countries": "Armenia",
  "decimals": 2,
  "iso_num": 51,
  "name": "Armenian dram",
  "symbol": ""
 },
 "ANG": {
  "code": "ANG",
  "countries": "Curaçao (CW), Sint Maarten (SX)",
  "decimals": 2,
  "iso_num": 532,
  "name": "Netherlands Antillean guilder",
  "symbol": "ƒ"
 },
 "AOA": {
  "code": "AOA",
  "countries": "Angola",
  "decimals": 2,
  "iso_num": 973,
  "name": "Angolan kwanza",
  "symbol": "Kz"
 },
 "ARS": {
  "code": "ARS",
  "countries": "Argentina",
  "decimals": 2,
  "iso_num": 32,
  "name": "Argentine peso",
  "symbol": "$"
 },
 "AUD": {
  "code": "AUD",
  "countries": "Australia, Christmas Island (CX), Cocos (Keeling) Islands (CC), Heard Island and McDonald Islands (HM), Kiribati (KI), Nauru (NR), Norfolk Island (NF), Tuvalu (TV)",
  "decimals": 2,
  "iso_num": 36,
  "name": "Australian dollar",
  "symbol": "$"
 },
 "AWG": {
  "code": "AWG",
  "countries": "Aruba",
  "decimals": 2,
  "iso_num": 533,
  "name": "Aruban florin",
  "symbol": "ƒ"
 },
 "AZN": {
  "code": "AZN",
  "countries": "Azerbaijan",
  "decimals": 2,
  "iso_num": 944,
  "name": "Azerbaijani manat",
  "symbol": "₼"
 },
 "BAM": {
  "code": "BAM",
  "countries": "Bosnia and Herzegovina",
  "decimals": 2,
  "iso_num": 977,
  "name": "Bosnia and Herzegovina convertible mark",
  "symbol": "KM"
 },
 "BBD": {
  "code": "BBD",
  "countries": "Barbados",
  "decimals": 2,
  "iso_num": 52,
  "name": "Barbados dollar",
  "symbol": "Bds$"
 },
 "BDT": {
  "code": "BDT",
  "countries": "Bangladesh",
  "decimals": 2,
  "iso_num": 50,
  "name": "Bangladeshi taka",
  "symbol": "৳"
 },
 "BGN": {
  "code": "BGN",
  "countries": "Bulgaria",
  "decimals": 2,
  "iso_num": 975,
  "name": "Bulgarian lev",
  "symbol": "лв"
 },
 "BHD": {
  "code": "BHD",
  "countries": "Bahrain",
  "decimals": 3,
  "iso_num": 48,
  "name": "Bahraini dinar",
  "symbol": ".د.ب"
 },
 "BIF": {
  "code": "BIF",
  "countries": "Burundi",
  "decimals": 0,
  "iso_num": 108,
  "name": "Burundian franc",
  "symbol": "FBu"
 },
 "BMD": {
  "code": "BMD",
  "countries": "Bermuda",
  "decimals": 2,
  "iso_num": 60,
  "name": "Bermudian dollar",
  "symbol": "BD$"
 },
 "BND": {
  "code": "BND",
  "countries": "Brunei",
  "decimals": 2,
  "iso_num": 96,
  "name": "Brunei dollar",
  "symbol": "B$"
 },
 "BOB": {
  "code": "BOB",
  "countries": "Bolivia",
  "decimals": 2,
  "iso_num": 68,
  "name": "Boliviano",
  "symbol": "Bs"
 },
 "BRL": {
  "code": "BRL",
  "countries": "Brazil",
  "decimals": 2,
  "iso_num": 986,
  "name": "Brazilian real",
  "symbol": "R$"
 },
 "BSD": {
  "code": "BSD",
  "countries": "Bahamas",
  "decimals": 2,
  "iso_num": 44,
  "name": "Bahamian dollar",
  "symbol": "B$"
 },
 "BTN": {
  "code": "BTN",
  "countries": "Bhutan",
  "decimals": 2,
  "iso_num": 64,
  "name": "Bhutanese ngultrum",
  "symbol": "Nu."
 },
 "BWP": {
  "code": "BWP",
  "countries": "Botswana",
  "decimals": 2,
  "iso_num": 72,
  "name": "Botswana pula",
  "symbol": "P"
 },
 "BYN": {
  "code": "BYN",
  "countries": "Belarus",
  "decimals": 2,
  "iso_num": 933,
  "name": "Belarusian ruble",
  "symbol": "Br"
 },
 "BZD": {
  "code": "BZD",
  "countries": "Belize",
  "decimals": 2,
  "iso_num": 84,
  "name": "Belize dollar",
  "symbol": "BZ$"
 },
 "CAD": {
  "code": "CAD",
  "countries": "Canada",
  "decimals": 2,
  "iso_num": 124,
  "name": "Canadian dollar",
  "symbol": "$"
 },
 "CDF": {
  "code": "CDF",
  "countries": "Democratic Republic of the Congo",
  "decimals": 2,
  "iso_num": 976,
  "name": "Congolese franc",
  "symbol": "FC"
 },
 "CHF": {
  "code": "CHF",
  "countries": "Switzerland, Liechtenstein (LI)",
  "decimals": 2,
  "iso_num": 756,
  "name": "Swiss franc",
  "symbol": "SFr"
 },
 "CLF": {
  "code": "CLF",
  "countries": "Chile",
  "decimals": 4,
  "iso_num": 990,
  "name": "Unidad de Fomento (funds code)",
  "symbol": "UF"
 },
 "CLP": {
  "code": "CLP",
  "countries": "Chile",
  "decimals": 0,
  "iso_num": 152,
  "name": "Chilean peso",
  "symbol": "$"
 },
 "CNY": {
  "code": "CNY",
  "countries": "China",
  "decimals": 2,
  "iso_num": 156,
  "name": "Chinese yuan",
  "symbol": "¥"
 },
 "COP": {
  "code": "COP",
  "countries": "Colombia",
  "decimals": 2,
  "iso_num": 170,
  "name": "Colombian peso",
  "symbol": "$"
 },
 "CRC": {
  "code": "CRC",
  "countries": "Costa Rica",
  "decimals": 2,
  "iso_num": 188,
  "name": "Costa Rican colon",
  "symbol": "₡"
 },
 "CUP": {
  "code": "CUP",
  "countries": "Cuba",
  "decimals": 2,
  "iso_num": 192,
  "name": "Cuban peso",
  "symbol": "$"
 },
 "CVE": {
  "code": "CVE",
  "countries": "Cabo Verde",
  "decimals": 2,
  "iso_num": 132,
  "name": "Cape Verdean escudo",
  "symbol": "$"
 },
 "CZK": {
  "code": "CZK",
  "countries": "Czechia",
  "decimals": 2,
  "iso_num": 203,
  "name": "Czech koruna",
  "symbol": "Kč"
 },
 "DJF": {
  "code": "DJF",
  "countries": "Djibouti",
  "decimals": 0,
  "iso_num": 262,
  "name": "Djiboutian franc",
  "symbol": "Fdj"
 },
 "DKK": {
  "code": "DKK",
  "countries": "Denmark, Faroe Islands (FO), Greenland (GL)",
  "decimals": 2,
  "iso_num": 208,
  "name": "Danish krone",
  "symbol": "kr."
 },
 "DOP": {
  "code": "DOP",
  "countries": "Dominican Republic",
  "decimals": 2,
  "iso_num": 214,
  "name": "Dominican peso",
  "symbol": "$"
 },
 "DZD": {
  "code": "DZD",
  "countries": "Algeria",
  "decimals": 2,
  "iso_num": 12,
  "name": "Algerian dinar",
  "symbol": "دج"
 },
 "EGP": {
  "code": "EGP",
  "countries": "Egypt",
  "decimals": 2,
  "iso_num": 818,
  "name": "Egyptian pound",
  "symbol": "E£"
 },
 "ERN": {
  "code": "ERN",
  "countries": "Eritrea",
  "decimals": 2,
  "iso_num": 232,
  "name": "Eritrean nakfa",
  "symbol": "Nkf"
 },
 "ETB": {
  "code": "ETB",
  "countries": "Ethiopia",
  "decimals": 2,
  "iso_num": 230,
  "name": "Ethiopian birr",
  "symbol": "Br"
 },
 "EUR": {
  "code": "EUR",
  "countries": "Åland Islands (AX), European Union (EU), Andorra (AD), Austria (AT), Belgium (BE), Cyprus (CY), Estonia (EE), Finland (FI), France (FR), French Southern and Antarctic Lands (TF), Germany (DE), Greece (GR), Guadeloupe (GP), Ireland (IE), Italy (IT), Latvia (LV), Lithuania (LT), Luxembourg (LU), Malta (MT), French Guiana (GF), Martinique (MQ), Mayotte (YT), Monaco (MC), Montenegro (ME), Netherlands (NL), Portugal (PT), Réunion (RE), Saint Barthélemy (BL), Saint Martin (MF), Saint Pierre and Miquelon (PM), San Marino (SM), Slovakia (SK), Slovenia (SI), Spain (ES), Vatican City (VA)",
  "decimals": 2,
  "iso_num": 978,
  "name": "Euro",
  "symbol": "€"
 },
 "FJD": {
  "code": "FJD",
  "countries": "Fiji",
  "decimals": 2,
  "iso_num": 242,
  "name": "Fiji dollar",
  "symbol": "FJ$"
 },
 "FKP": {
  "code": "FKP",
  "countries": "Falkland Islands (pegged to GBP 1:1)",
  "decimals": 2,
  "iso_num": 238,
  "name": "Falkland Islands pound",
  "symbol": "£"
 },
 "GBP": {
  "code": "GBP",
  "countries": "United Kingdom, the Isle of Man (IM, see Manx pound), Jersey (JE, see Jersey pound), and Guernsey (GG, see Guernsey pound)",
  "decimals": 2,
  "iso_num": 826,
  "name": "Pound sterling",
  "symbol": "£"
 },
 "GEL": {
  "code": "GEL",
  "countries": "Georgia",
  "decimals": 2,
  "iso_num": 981,
  "name": "Georgian lari",
  "symbol": "₾"
 },
 "GHS": {
  "code": "GHS",
  "countries": "Ghana",
  "decimals": 2,
  "iso_num": 936,
  "name": "Ghanaian cedi",
  "symbol": "GH₵"
 },
 "GIP": {
  "code": "GIP",
  "countries": "Gibraltar (pegged to GBP 1:1)",
  "decimals": 2,
  "iso_num": 292,
  "name": "Gibraltar pound",
  "symbol": "£"
 },
 "GMD": {
  "code": "GMD",
  "countries": "Gambia",
  "decimals": 2,
  "iso_num": 270,
  "name": "Gambian dalasi",
  "symbol": "D"
 },
 "GNF": {
  "code": "GNF",
  "countries": "Guinea",
  "decimals": 0,
  "iso_num": 324,
  "name": "Guinean franc",
  "symbol": "FG"
 },
 "GTQ": {
  "code": "GTQ",
  "countries": "Guatemala",
  "decimals": 2,
  "iso_num": 320,
  "name": "Guatemalan quetzal",
  "symbol": "Q"
 },
 "GYD": {
  "code": "GYD",
  "countries": "Guyana",
  "decimals": 2,
  "iso_num": 328,
  "name": "Guyanese dollar",
  "symbol": "G$"
 },
 "HKD": {
  "code": "HKD",
  "countries": "Hong Kong",
  "decimals": 2,
  "iso_num": 344,
  "name": "Hong Kong dollar",
  "symbol": "HK$"
 },
 "HNL": {
  "code": "HNL",
  "countries": "Honduras",
  "decimals": 2,
  "iso_num": 340,
  "name": "Honduran lempira",
  "symbol": "L"
 },
 "HRK": {
  "code": "HRK",
  "countries": "Croatia",
  "decimals": 2,
  "iso_num": 191,
  "name": "Croatian kuna",
  "symbol": "kn"
 },
 "HTG": {
  "code": "HTG",
  "countries": "Haiti",
  "decimals": 2,
  "iso_num": 332,
  "name": "Haitian gourde",
  "symbol": "G"
 },
 "HUF": {
  "code": "HUF",
  "countries": "Hungary",
  "decimals": 2,
  "iso_num": 348,
  "name": "Hungarian forint",
  "symbol": "Ft"
 },
 "IDR": {
  "code": "IDR",
  "countries": "Indonesia",
  "decimals": 2,
  "iso_num": 360,
  "name": "Indonesian rupiah",
  "symbol": "Rp"
 },
 "ILS": {
  "code": "ILS",
  "countries": "Israel",
  "decimals": 2,
  "iso_num": 376,
  "name": "Israeli new shekel",
  "symbol": "₪"
 },
 "INR": {
  "code": "INR",
  "countries": "India, Bhutan",
  "decimals": 2,
  "iso_num": 356,
  "name": "Indian rupee",
  "symbol": "₹"
 },
 "IQD": {
  "code": "IQD",
  "countries": "Iraq",
  "decimals": 3,
  "iso_num": 368,
  "name": "Iraqi dinar",
  "symbol": "د.ع"
 },
 "IRR": {
  "code": "IRR",
  "countries": "Iran",
  "decimals": 2,
  "iso_num": 364,
  "name": "Iranian rial",
  "symbol": "﷼"
 },
 "ISK": {
  "code": "ISK",
  "countries": "Iceland",
  "decimals": 0,
  "iso_num": 352,
  "name": "Icelandic króna",
  "symbol": "kr"
 },
 "JMD": {
  "code": "JMD",
  "countries": "Jamaica",
  "decimals": 2,
  "iso_num": 388,
  "name": "Jamaican dollar",
  "symbol": "J$"
 },
 "JOD": {
  "code": "JOD",
  "countries": "Jordan",
  "decimals": 3,
  "iso_num": 400,
  "name": "Jordanian dinar",
  "symbol": "$"
 },
 "JPY": {
  "code": "JPY",
  "countries": "Japan",
  "decimals": 0,
  "iso_num": 392,
  "name": "Japanese yen",
  "symbol": "د.أ"
 },
 "KES": {
  "code": "KES",
  "countries": "Kenya",
  "decimals": 2,
  "iso_num": 404,
  "name": "Kenyan shilling",
  "symbol": "$"
 },
 "KGS": {
  "code": "KGS",
  "countries": "Kyrgyzstan",
  "decimals": 2,
  "iso_num": 417,
  "name": "Kyrgyzstani som",
  "symbol": "KSh"
 },
 "KHR": {
  "code": "KHR",
  "countries": "Cambodia",
  "decimals": 2,
  "iso_num": 116,
  "name": "Cambodian riel",
  "symbol": "С̲"
 },
 "KMF": {
  "code": "KMF",
  "countries": "Comoros",
  "decimals": 0,
  "iso_num": 174,
  "name": "Comoro franc",
  "symbol": "៛"
 },
 "KPW": {
  "code": "KPW",
  "countries": "North Korea",
  "decimals": 2,
  "iso_num": 408,
  "name": "North Korean won",
  "symbol": "₩"
 },
 "KRW": {
  "code": "KRW",
  "countries": "South Korea",
  "decimals": 0,
  "iso_num": 410,
  "name": "South Korean won",
  "symbol": "₩"
 },
 "KWD": {
  "code": "KWD",
  "countries": "Kuwait",
  "decimals": 3,
  "iso_num": 414,
  "name": "Kuwaiti dinar",
  "symbol": "د.ك"
 },
 "KYD": {
  "code": "KYD",
  "countries": "Cayman Islands",
  "decimals": 2,
  "iso_num": 136,
  "name": "Cayman Islands dollar",
  "symbol": "CI$"
 },
 "KZT": {
  "code": "KZT",
  "countries": "Kazakhstan",
  "decimals": 2,
  "iso_num": 398,
  "name": "Kazakhstani tenge",
  "symbol": "₸"
 },
 "LAK": {
  "code": "LAK",
  "countries": "Laos",
  "decimals": 2,
  "iso_num": 418,
  "name": "Lao kip",
  "symbol": "₭"
 },
 "LBP": {
  "code": "LBP",
  "countries": "Lebanon",
  "decimals": 2,
  "iso_num": 422,
  "name": "Lebanese pound",
  "symbol": "ل.ل."
 },
 "LKR": {
  "code": "LKR",
  "countries": "Sri Lanka",
  "decimals": 2,
  "iso_num": 144,
  "name": "Sri Lankan rupee",
  "symbol": "Rs"
 },
 "LRD": {
  "code": "LRD",
  "countries": "Liberia",
  "decimals": 2,
  "iso_num": 430,
  "name": "Liberian dollar",
  "symbol": "L$"
 },
 "LSL": {
  "code": "LSL",
  "countries": "Lesotho",
  "decimals": 2,
  "iso_num": 426,
  "name": "Lesotho loti",
  "symbol": "L"
 },
 "LYD": {
  "code": "LYD",
  "countries": "Libya",
  "decimals": 3,
  "iso_num": 434,
  "name": "Libyan dinar",
  "symbol": "LD"
 },
 "MAD": {
  "code": "MAD",
  "countries": "Morocco, Western Sahara",
  "decimals": 2,
  "iso_num": 504,
  "name": "Moroccan dirham",
  "symbol": "DH"
 },
 "MDL": {
  "code": "MDL",
  "countries": "Moldova",
  "decimals": 2,
  "iso_num": 498,
  "name": "Moldovan leu",
  "symbol": "lei"
 },
 "MGA": {
  "code": "MGA",
  "countries": "Madagascar",
  "decimals": 2,
  "iso_num": 969,
  "name": "Malagasy ariary",
  "symbol": "Ar"
 },
 "MKD": {
  "code": "MKD",
  "countries": "North Macedonia",
  "decimals": 2,
  "iso_num": 807,
  "name": "Macedonian denar",
  "symbol": "den"
 },
 "MMK": {
  "code": "MMK",
  "countries": "Myanmar",
  "decimals": 2,
  "iso_num": 104,
  "name": "Myanmar kyat",
  "symbol": "K"
 },
 "MNT": {
  "code": "MNT",
  "countries": "Mongolia",
  "decimals": 2,
  "iso_num": 496,
  "name": "Mongolian tögrög",
  "symbol": "₮"
 },
 "MOP": {
  "code": "MOP",
  "countries": "Macau",
  "decimals": 2,
  "iso_num": 446,
  "name": "Macanese pataca",
  "symbol": "MOP$"
 },
 "MRU": {
  "code": "MRU",
  "countries": "Mauritania",
  "decimals": 2,
  "iso_num": 929,
  "name": "Mauritanian ouguiya",
  "symbol": "UM"
 },
 "MUR": {
  "code": "MUR",
  "countries": "Mauritius",
  "decimals": 2,
  "iso_num": 480,
  "name": "Mauritian rupee",
  "symbol": "₨"
 },
 "MVR": {
  "code": "MVR",
  "countries": "Maldives",
  "decimals": 2,
  "iso_num": 462,
  "name": "Maldivian rufiyaa",
  "symbol": "Rf"
 },
 "MWK": {
  "code": "MWK",
  "countries": "Malawi",
  "decimals": 2,
  "iso_num": 454,
  "name": "Malawian kwacha",
  "symbol": "K"
 },
 "MXN": {
  "code": "MXN",
  "countries": "Mexico",
  "decimals": 2,
  "iso_num": 484,
  "name": "Mexican peso",
  "symbol": "$"
 },
 "MYR": {
  "code": "MYR",
  "countries": "Malaysia",
  "decimals": 2,
  "iso_num": 458,
  "name": "Malaysian ringgit",
  "symbol": "RM"
 },
 "MZN": {
  "code": "MZN",
  "countries": "Mozambique",
  "decimals": 2,
  "iso_num": 943,
  "name": "Mozambican metical",
  "symbol": "MT"
 },
 "NAD": {
  "code": "NAD",
  "countries": "Namibia",
  "decimals": 2,
  "iso_num": 516,
  "name": "Namibian dollar",
  "symbol": "N$"
 },
 "NGN": {
  "code": "NGN",
  "countries": "Nigeria",
  "decimals": 2,
  "iso_num": 566,
  "name": "Nigerian naira",
  "symbol": "₦"
 },
 "NIO": {
  "code": "NIO",
  "countries": "Nicaragua",
  "decimals": 2,
  "iso_num": 558,
  "name": "Nicaraguan córdoba",
  "symbol": "C$"
 },
 "NOK": {
  "code": "NOK",
  "countries": "Norway, Svalbard and Jan Mayen (SJ), Bouvet Island (BV)",
  "decimals": 2,
  "iso_num": 578,
  "name": "Norwegian krone",
  "symbol": "kr"
 },
 "NPR": {
  "code": "NPR",
  "countries": "Nepal",
  "decimals": 2,
  "iso_num": 524,
  "name": "Nepalese rupee",
  "symbol": "रू"
 },
 "NZD": {
  "code": "NZD",
  "countries": "New Zealand, Cook Islands (CK), Niue (NU), Pitcairn Islands (PN; see also Pitcairn Islands dollar), Tokelau (TK)",
  "decimals": 2,
  "iso_num": 554,
  "name": "New Zealand dollar",
  "symbol": "NZ$"
 },
 "OMR": {
  "code": "OMR",
  "countries": "Oman",
  "decimals": 3,
  "iso_num": 512,
  "name": "Omani rial",
  "symbol": "ر.ع."
 },
 "PAB": {
  "code": "PAB",
  "countries": "Panama",
  "decimals": 2,
  "iso_num": 590,
  "name": "Panamanian balboa",
  "symbol": "B/."
 },
 "PEN": {
  "code": "PEN",
  "countries": "Peru",
  "decimals": 2,
  "iso_num": 604,
  "name": "Peruvian sol",
  "symbol": "S/"
 },
 "PGK": {
  "code": "PGK",
  "countries": "Papua New Guinea",
  "decimals": 2,
  "iso_num": 598,
  "name": "Papua New Guinean kina",
  "symbol": "K"
 },
 "PHP": {
  "code": "PHP",
  "countries": "Philippines",
  "decimals": 2,
  "iso_num": 608,
  "name": "Philippine peso[12]",
  "symbol": "₱"
 },
 "PKR": {
  "code": "PKR",
  "countries": "Pakistan",
  "decimals": 2,
  "iso_num": 586,
  "name": "Pakistani rupee",
  "symbol": "₨"
 },
 "PLN": {
  "code": "PLN",
  "countries": "Poland",
  "decimals": 2,
  "iso_num": 985,
  "name": "Polish złoty",
  "symbol": "zł"
 },
 "PYG": {
  "code": "PYG",
  "countries": "Paraguay",
  "decimals": 0,
  "iso_num": 600,
  "name": "Paraguayan guaraní",
  "symbol": "₲"
 },
 "QAR": {
  "code": "QAR",
  "countries": "Qatar",
  "decimals": 2,
  "iso_num": 634,
  "name": "Qatari riyal",
  "symbol": "QR"
 },
 "RON": {
  "code": "RON",
  "countries": "Romania",
  "decimals": 2,
  "iso_num": 946,
  "name": "Romanian leu",
  "symbol": "L"
 },
 "RSD": {
  "code": "RSD",
  "countries": "Serbia",
  "decimals": 2,
  "iso_num": 941,
  "name": "Serbian dinar",
  "symbol": "din"
 },
 "RUB": {
  "code": "RUB",
  "countries": "Russia",
  "decimals": 2,
  "iso_num": 643,
  "name": "Russian ruble",
  "symbol": "₽"
 },
 "RWF": {
  "code": "RWF",
  "countries": "Rwanda",
  "decimals": 0,
  "iso_num": 646,
  "name": "Rwandan franc",
  "symbol": "FRw"
 },
 "SAR": {
  "code": "SAR",
  "countries": "Saudi Arabia",
  "decimals": 2,
  "iso_num": 682,
  "name": "Saudi riyal",
  "symbol": "SAR"
 },
 "SBD": {
  "code": "SBD",
  "countries": "Solomon Islands",
  "decimals": 2,
  "iso_num": 90,
  "name": "Solomon Islands dollar",
  "symbol": "SI$"
 },
 "SCR": {
  "code": "SCR",
  "countries": "Seychelles",
  "decimals": 2,
  "iso_num": 690,
  "name": "Seychelles rupee",
  "symbol": "SCR"
 },
 "SDG": {
  "code": "SDG",
  "countries": "Sudan",
  "decimals": 2,
  "iso_num": 938,
  "name": "Sudanese pound",
  "symbol": "SS£"
 },
 "SEK": {
  "code": "SEK",
  "countries": "Sweden",
  "decimals": 2,
  "iso_num": 752,
  "name": "Swedish krona/kronor",
  "symbol": "kr"
 },
 "SGD": {
  "code": "SGD",
  "countries": "Singapore",
  "decimals": 2,
  "iso_num": 702,
  "name": "Singapore dollar",
  "symbol": "S$"
 },
 "SHP": {
  "code": "SHP",
  "countries": "Saint Helena (SH-SH), Ascension Island (SH-AC), Tristan da Cunha",
  "decimals": 2,
  "iso_num": 654,
  "name": "Saint Helena pound",
  "symbol": "£"
 },
 "SLL": {
  "code": "SLL",
  "countries": "Sierra Leone",
  "decimals": 2,
  "iso_num": 694,
  "name": "Sierra Leonean leone",
  "symbol": "Le"
 },
 "SOS": {
  "code": "SOS",
  "countries": "Somalia",
  "decimals": 2,
  "iso_num": 706,
  "name": "Somali shilling",
  "symbol": "Sh.So."
 },
 "SRD": {
  "code": "SRD",
  "countries": "Suriname",
  "decimals": 2,
  "iso_num": 968,
  "name": "Surinamese dollar",
  "symbol": "SR$"
 },
 "SSP": {
  "code": "SSP",
  "countries": "South Sudan",
  "decimals": 2,
  "iso_num": 728,
  "name": "South Sudanese pound",
  "symbol": "SS£"
 },
 "STN": {
  "code": "STN",
  "countries": "São Tomé and Príncipe",
  "decimals": 2,
  "iso_num": 930,
  "name": "São Tomé and Príncipe dobra",
  "symbol": "Db"
 },
 "SVC": {
  "code": "SVC",
  "countries": "El Salvador",
  "decimals": 2,
  "iso_num": 222,
  "name": "Salvadoran colón",
  "symbol": "₡"
 },
 "SYP": {
  "code": "SYP",
  "countries": "Syria",
  "decimals": 2,
  "iso_num": 760,
  "name": "Syrian pound",
  "symbol": "LS"
 },
 "SZL": {
  "code": "SZL",
  "countries": "Eswatini",
  "decimals": 2,
  "iso_num": 748,
  "name": "Swazi lilangeni",
  "symbol": "L"
 },
 "THB": {
  "code": "THB",
  "countries": "Thailand",
  "decimals": 2,
  "iso_num": 764,
  "name": "Thai baht",
  "symbol": "฿"
 },
 "TJS": {
  "code": "TJS",
  "countries": "Tajikistan",
  "decimals": 2,
  "iso_num": 972,
  "name": "Tajikistani somoni",
  "symbol": "SM"
 },
 "TMT": {
  "code": "TMT",
  "countries": "Turkmenistan",
  "decimals": 2,
  "iso_num": 934,
  "name": "Turkmenistan manat",
  "symbol": "T"
 },
 "TND": {
  "code": "TND",
  "countries": "Tunisia",
  "decimals": 3,
  "iso_num": 788,
  "name": "Tunisian dinar",
  "symbol": "DT"
 },
 "TOP": {
  "code": "TOP",
  "countries": "Tonga",
  "decimals": 2,
  "iso_num": 776,
  "name": "Tongan paʻanga",
  "symbol": "T$"
 },
 "TRY": {
  "code": "TRY",
  "countries": "Turkey",
  "decimals": 2,
  "iso_num": 949,
  "name": "Turkish lira",
  "symbol": "₺"
 },
 "TTD": {
  "code": "TTD",
  "countries": "Trinidad and Tobago",
  "decimals": 2,
  "iso_num": 780,
  "name": "Trinidad and Tobago dollar",
  "symbol": "TT$"
 },
 "TWD": {
  "code": "TWD",
  "countries": "Taiwan",
  "decimals": 2,
  "iso_num": 901,
  "name": "New Taiwan dollar",
  "symbol": "NT$"
 },
 "TZS": {
  "code": "TZS",
  "countries": "Tanzania",
  "decimals": 2,
  "iso_num": 834,
  "name": "Tanzanian shilling",
  "symbol": "TSh"
 },
 "UAH": {
  "code": "UAH",
  "countries": "Ukraine",
  "decimals": 2,
  "iso_num": 980,
  "name": "Ukrainian hryvnia",
  "symbol": "₴"
 },
 "UGX": {
  "code": "UGX",
  "countries": "Uganda",
  "decimals": 0,
  "iso_num": 800,
  "name": "Ugandan shilling",
  "symbol": "USh"
 },
 "USD": {
  "code": "USD",
  "countries": "United States, American Samoa (AS), British Indian Ocean Territory (IO) (also uses GBP), British Virgin Islands (VG), Caribbean Netherlands (BQ – Bonaire, Sint Eustatius and Saba), Ecuador (EC), El Salvador (SV), Guam (GU), Haiti (HT), Marshall Islands (MH), Federated States of Micronesia (FM), Northern Mariana Islands (MP), Palau (PW), Panama (PA) (as well as Panamanian Balboa), Puerto Rico (PR), Timor-Leste (TL), Turks and Caicos Islands (TC), U.S. Virgin Islands (VI), United States Minor Outlying Islands (UM)",
  "decimals": 2,
  "iso_num": 840,
  "name": "United States dollar",
  "symbol": "$"
 },
 "UYU": {
  "code": "UYU",
  "countries": "Uruguay",
  "decimals": 2,
  "iso_num": 858,
  "name": "Uruguayan peso",
  "symbol": "$"
 },
 "UZS": {
  "code": "UZS",
  "countries": "Uzbekistan",
  "decimals": 2,
  "iso_num": 860,
  "name": "Uzbekistan som",
  "symbol": "soʻm"
 },
 "VES": {
  "code": "VES",
  "countries": "Venezuela",
  "decimals": 2,
  "iso_num": 928,
  "name": "Venezuelan bolívar soberano",
  "symbol": "Bs.S."
 },
 "VND": {
  "code": "VND",
  "countries": "Vietnam",
  "decimals": 0,
  "iso_num": 704,
  "name": "Vietnamese đồng",
  "symbol": "₫"
 },
 "VUV": {
  "code": "VUV",
  "countries": "Vanuatu",
  "decimals": 0,
  "iso_num": 548,
  "name": "Vanuatu vatu",
  "symbol": "VT"
 },
 "WST": {
  "code": "WST",
  "countries": " Samoa",
  "decimals": 2,
  "iso_num": 882,
  "name": "Samoan tal",
  "symbol": "WS$"
 },
 "XAF": {
  "code": "XAF",
  "countries": "BEAC Cameroon (CM), Central African Republic (CF), Republic of the Congo (CG), Chad (TD), Equatorial Guinea (GQ), Gabon (GA)",
  "decimals": 0,
  "iso_num": 950,
  "name": "CFA franc",
  "symbol": "FCFA"
 },
 "XAG": {
  "code": "XAG",
  "countries": "",
  "decimals": null,
  "iso_num": 961,
  "name": "Silver (one troy ounce)",
  "symbol": ""
 },
 "XAU": {
  "code": "XAU",
  "countries": "",
  "decimals": null,
  "iso_num": 959,
  "name": "Gold (one troy ounce)",
  "symbol": ""
 },
 "XBA": {
  "code": "XBA",
  "countries": "",
  "decimals": null,
  "iso_num": 955,
  "name": "European Composite Unit (EURCO) (bond market unit)",
  "symbol": ""
 },
 "XBB": {
  "code": "XBB",
  "countries": "",
  "decimals": null,
  "iso_num": 956,
  "name": "European Monetary Unit (E.M.U.-6) (bond market unit)",
  "symbol": ""
 },
 "XBC": {
  "code": "XBC",
  "countries": "",
  "decimals": null,
  "iso_num": 957,
  "name": "European Unit of Account 9 (E.U.A.-9) (bond market unit)",
  "symbol": ""
 },
 "XBD": {
  "code": "XBD",
  "countries": "",
  "decimals": null,
  "iso_num": 958,
  "name": "European Unit of Account 17 (E.U.A.-17) (bond market unit)",
  "symbol": ""
 },
 "XCD": {
  "code": "XCD",
  "countries": " Anguilla (AI), Antigua and Barbuda (AG), Dominica (DM), Grenada (GD), Montserrat (MS), Saint Kitts and Nevis (KN), Saint Lucia (LC), Saint Vincent and the Grenadines (VC)",
  "decimals": 2,
  "iso_num": 951,
  "name": "East Caribbean dolla",
  "symbol": "$"
 },
 "XOF": {
  "code": "XOF",
  "countries": "BCEAO Benin (BJ), Burkina Faso (BF), Côte d'Ivoire (CI), Guinea-Bissau (GW), Mali (ML), Niger (NE), Senegal (SN), Togo (TG)",
  "decimals": 0,
  "iso_num": 952,
  "name": "CFA franc",
  "symbol": "CFA"
 },
 "XPD": {
  "code": "XPD",
  "countries": "",
  "decimals": null,
  "iso_num": 964,
  "name": "Palladium (one troy ounce)",
  "symbol": ""
 },
 "XPF": {
  "code": "XPF",
  "countries": "French territories of the Pacific Ocean: French Polynesia (PF), New Caledonia (NC), Wallis and Futuna (WF)",
  "decimals": 0,
  "iso_num": 953,
  "name": "CFP franc (franc Pacifique)",
  "symbol": "F"
 },
 "XPT": {
  "code": "XPT",
  "countries": "",
  "decimals": null,
  "iso_num": 962,
  "name": "Platinum (one troy ounce)",
  "symbol": ""
 },
 "XSU": {
  "code": "XSU",
  "countries": "",
  "decimals": null,
  "iso_num": 994,
  "name": "SUCRE Unified System for Regional Compensation (SUCRE)",
  "symbol": ""
 },
 "XTS": {
  "code": "XTS",
  "countries": "",
  "decimals": null,
  "iso_num": 963,
  "name": "Code reserved for testing",
  "symbol": ""
 },
 "XUA": {
  "code": "XUA",
  "countries": "",
  "decimals": null,
  "iso_num": 965,
  "name": "ADB Unit of Account African Development Bank",
  "symbol": ""
 },
 "XXX": {
  "code": "XXX",
  "countries": "",
  "decimals": null,
  "iso_num": 999,
  "name": "No currency",
  "symbol": ""
 },
 "YER": {
  "code": "YER",
  "countries": "Yemen",
  "decimals": 2,
  "iso_num": 886,
  "name": "Yemeni rial",
  "symbol": "ر.ي"
 },
 "ZAR": {
  "code": "ZAR",
  "countries": "Lesotho, Namibia, South Africa",
  "decimals": 2,
  "iso_num": 710,
  "name": "South African rand",
  "symbol": "R"
 },
 "ZMW": {
  "code": "ZMW",
  "countries": "Zambia",
  "decimals": 2,
  "iso_num": 967,
  "name": "Zambian kwacha",
  "symbol": "K"
 },
 "ZWL": {
  "code": "ZWL",
  "countries": "Zimbabwe",
  "decimals": 2,
  "iso_num": 932,
  "name": "Zimbabwean dollar",
  "symbol": "$"
 },
};

exports.FIAT = FIAT;
