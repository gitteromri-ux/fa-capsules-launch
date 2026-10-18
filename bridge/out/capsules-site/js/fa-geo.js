/* French Atelier checkout — country list (ISO 3166-1 alpha-2, name, dial code),
 * E.164 phone normalisation, and the NANPA area-code → US state map.
 * Data copied verbatim from the proven Longevity checkout (lla-country.js,
 * nanp-state-autofill.js). This file is PURE DATA + helpers: it never touches
 * the lead-gen forms (#lg-form, .advisor-form, .contact-form) or eTeacherLeads. */
(function(){
  'use strict';
  var RAW = 'US|United States|1;AF|Afghanistan|93;AL|Albania|355;DZ|Algeria|213;AD|Andorra|376;AO|Angola|244;AG|Antigua and Barbuda|1;AR|Argentina|54;AM|Armenia|374;AU|Australia|61;AT|Austria|43;AZ|Azerbaijan|994;BS|Bahamas|1;BH|Bahrain|973;BD|Bangladesh|880;BB|Barbados|1;BY|Belarus|375;BE|Belgium|32;BZ|Belize|501;BJ|Benin|229;BM|Bermuda|1;BT|Bhutan|975;BO|Bolivia|591;BA|Bosnia and Herzegovina|387;BW|Botswana|267;BR|Brazil|55;BN|Brunei|673;BG|Bulgaria|359;BF|Burkina Faso|226;BI|Burundi|257;KH|Cambodia|855;CM|Cameroon|237;CA|Canada|1;CV|Cape Verde|238;KY|Cayman Islands|1;CF|Central African Republic|236;TD|Chad|235;CL|Chile|56;CN|China|86;CO|Colombia|57;KM|Comoros|269;CG|Congo|242;CD|Congo (DRC)|243;CR|Costa Rica|506;CI|Cote d Ivoire|225;HR|Croatia|385;CU|Cuba|53;CY|Cyprus|357;CZ|Czechia|420;DK|Denmark|45;DJ|Djibouti|253;DM|Dominica|1;DO|Dominican Republic|1;EC|Ecuador|593;EG|Egypt|20;SV|El Salvador|503;GQ|Equatorial Guinea|240;ER|Eritrea|291;EE|Estonia|372;SZ|Eswatini|268;ET|Ethiopia|251;FJ|Fiji|679;FI|Finland|358;FR|France|33;GA|Gabon|241;GM|Gambia|220;GE|Georgia|995;DE|Germany|49;GH|Ghana|233;GI|Gibraltar|350;GR|Greece|30;GD|Grenada|1;GT|Guatemala|502;GN|Guinea|224;GW|Guinea-Bissau|245;GY|Guyana|592;HT|Haiti|509;HN|Honduras|504;HK|Hong Kong|852;HU|Hungary|36;IS|Iceland|354;IN|India|91;ID|Indonesia|62;IR|Iran|98;IQ|Iraq|964;IE|Ireland|353;IL|Israel|972;IT|Italy|39;JM|Jamaica|1;JP|Japan|81;JO|Jordan|962;KZ|Kazakhstan|7;KE|Kenya|254;KI|Kiribati|686;KW|Kuwait|965;KG|Kyrgyzstan|996;LA|Laos|856;LV|Latvia|371;LB|Lebanon|961;LS|Lesotho|266;LR|Liberia|231;LY|Libya|218;LI|Liechtenstein|423;LT|Lithuania|370;LU|Luxembourg|352;MO|Macau|853;MG|Madagascar|261;MW|Malawi|265;MY|Malaysia|60;MV|Maldives|960;ML|Mali|223;MT|Malta|356;MH|Marshall Islands|692;MR|Mauritania|222;MU|Mauritius|230;MX|Mexico|52;FM|Micronesia|691;MD|Moldova|373;MC|Monaco|377;MN|Mongolia|976;ME|Montenegro|382;MA|Morocco|212;MZ|Mozambique|258;MM|Myanmar|95;NA|Namibia|264;NR|Nauru|674;NP|Nepal|977;NL|Netherlands|31;NZ|New Zealand|64;NI|Nicaragua|505;NE|Niger|227;NG|Nigeria|234;MK|North Macedonia|389;NO|Norway|47;OM|Oman|968;PK|Pakistan|92;PW|Palau|680;PS|Palestine|970;PA|Panama|507;PG|Papua New Guinea|675;PY|Paraguay|595;PE|Peru|51;PH|Philippines|63;PL|Poland|48;PT|Portugal|351;PR|Puerto Rico|1;QA|Qatar|974;RO|Romania|40;RU|Russia|7;RW|Rwanda|250;KN|Saint Kitts and Nevis|1;LC|Saint Lucia|1;VC|Saint Vincent and the Grenadines|1;WS|Samoa|685;SM|San Marino|378;SA|Saudi Arabia|966;SN|Senegal|221;RS|Serbia|381;SC|Seychelles|248;SL|Sierra Leone|232;SG|Singapore|65;SK|Slovakia|421;SI|Slovenia|386;SB|Solomon Islands|677;SO|Somalia|252;ZA|South Africa|27;KR|South Korea|82;SS|South Sudan|211;ES|Spain|34;LK|Sri Lanka|94;SD|Sudan|249;SR|Suriname|597;SE|Sweden|46;CH|Switzerland|41;SY|Syria|963;TW|Taiwan|886;TJ|Tajikistan|992;TZ|Tanzania|255;TH|Thailand|66;TL|Timor-Leste|670;TG|Togo|228;TO|Tonga|676;TT|Trinidad and Tobago|1;TN|Tunisia|216;TR|Turkey|90;TM|Turkmenistan|993;TV|Tuvalu|688;UG|Uganda|256;UA|Ukraine|380;AE|United Arab Emirates|971;GB|United Kingdom|44;UY|Uruguay|598;UZ|Uzbekistan|998;VU|Vanuatu|678;VA|Vatican City|379;VE|Venezuela|58;VN|Vietnam|84;YE|Yemen|967;ZM|Zambia|260;ZW|Zimbabwe|263';
  var LIST = RAW.split(';').map(function(r){ var p=r.split('|'); return {iso:p[0],name:p[1],dial:p[2]}; });
  var BY_ISO = {}; LIST.forEach(function(c){ BY_ISO[c.iso]=c; });
  var NANP = {
    // Alabama
    '205':'AL','251':'AL','256':'AL','334':'AL','483':'AL','659':'AL','938':'AL',
    // Alaska
    '907':'AK',
    // Arizona
    '480':'AZ','520':'AZ','602':'AZ','623':'AZ','928':'AZ',
    // Arkansas
    '327':'AR','479':'AR','501':'AR','870':'AR',
    // California
    '209':'CA','213':'CA','279':'CA','310':'CA','323':'CA','341':'CA','350':'CA','369':'CA','408':'CA','415':'CA','424':'CA','442':'CA','510':'CA','530':'CA','559':'CA','562':'CA','619':'CA','626':'CA','628':'CA','650':'CA','657':'CA','661':'CA','669':'CA','707':'CA','714':'CA','738':'CA','747':'CA','760':'CA','805':'CA','818':'CA','820':'CA','831':'CA','840':'CA','858':'CA','909':'CA','916':'CA','925':'CA','949':'CA','951':'CA',
    // Colorado
    '303':'CO','719':'CO','720':'CO','970':'CO','983':'CO',
    // Connecticut
    '203':'CT','475':'CT','860':'CT','959':'CT',
    // Delaware
    '302':'DE',
    // District of Columbia
    '202':'DC','771':'DC',
    // Florida
    '239':'FL','305':'FL','321':'FL','324':'FL','352':'FL','386':'FL','407':'FL','448':'FL','561':'FL','645':'FL','656':'FL','689':'FL','727':'FL','728':'FL','754':'FL','772':'FL','786':'FL','813':'FL','850':'FL','863':'FL','904':'FL','941':'FL','954':'FL',
    // Georgia
    '229':'GA','404':'GA','470':'GA','478':'GA','678':'GA','706':'GA','762':'GA','770':'GA','912':'GA','943':'GA',
    // Hawaii
    '808':'HI',
    // Idaho
    '208':'ID','986':'ID',
    // Illinois
    '217':'IL','224':'IL','309':'IL','312':'IL','331':'IL','447':'IL','464':'IL','618':'IL','630':'IL','708':'IL','730':'IL','773':'IL','779':'IL','815':'IL','847':'IL','872':'IL',
    // Indiana
    '219':'IN','260':'IN','317':'IN','463':'IN','574':'IN','765':'IN','812':'IN','930':'IN',
    // Iowa
    '319':'IA','515':'IA','563':'IA','641':'IA','712':'IA',
    // Kansas
    '316':'KS','620':'KS','785':'KS','913':'KS',
    // Kentucky
    '270':'KY','364':'KY','502':'KY','606':'KY','859':'KY',
    // Louisiana
    '225':'LA','318':'LA','337':'LA','457':'LA','504':'LA','985':'LA',
    // Maine
    '207':'ME',
    // Maryland
    '227':'MD','240':'MD','301':'MD','410':'MD','443':'MD','667':'MD',
    // Massachusetts
    '339':'MA','351':'MA','413':'MA','508':'MA','617':'MA','657':'MA','774':'MA','781':'MA','857':'MA','978':'MA',
    // Michigan
    '231':'MI','248':'MI','269':'MI','313':'MI','517':'MI','586':'MI','616':'MI','679':'MI','734':'MI','810':'MI','906':'MI','947':'MI','989':'MI',
    // Minnesota
    '218':'MN','320':'MN','507':'MN','612':'MN','651':'MN','763':'MN','952':'MN',
    // Mississippi
    '228':'MS','601':'MS','662':'MS','769':'MS',
    // Missouri
    '235':'MO','314':'MO','417':'MO','557':'MO','573':'MO','636':'MO','660':'MO','816':'MO','975':'MO',
    // Montana
    '406':'MT',
    // Nebraska
    '308':'NE','402':'NE','531':'NE',
    // Nevada
    '702':'NV','725':'NV','775':'NV',
    // New Hampshire
    '603':'NH',
    // New Jersey
    '201':'NJ','551':'NJ','609':'NJ','640':'NJ','732':'NJ','848':'NJ','856':'NJ','862':'NJ','908':'NJ','973':'NJ',
    // New Mexico
    '505':'NM','575':'NM',
    // New York
    '212':'NY','315':'NY','329':'NY','332':'NY','347':'NY','363':'NY','516':'NY','518':'NY','585':'NY','607':'NY','624':'NY','631':'NY','646':'NY','680':'NY','716':'NY','718':'NY','838':'NY','845':'NY','914':'NY','917':'NY','929':'NY','934':'NY',
    // North Carolina
    '252':'NC','336':'NC','472':'NC','704':'NC','743':'NC','828':'NC','910':'NC','919':'NC','980':'NC','984':'NC',
    // North Dakota
    '701':'ND',
    // Ohio
    '216':'OH','220':'OH','234':'OH','283':'OH','326':'OH','330':'OH','380':'OH','419':'OH','436':'OH','440':'OH','513':'OH','567':'OH','614':'OH','740':'OH','937':'OH',
    // Oklahoma
    '405':'OK','539':'OK','572':'OK','580':'OK','918':'OK',
    // Oregon
    '458':'OR','503':'OR','541':'OR','971':'OR',
    // Pennsylvania
    '215':'PA','223':'PA','267':'PA','272':'PA','412':'PA','445':'PA','484':'PA','570':'PA','582':'PA','610':'PA','717':'PA','724':'PA','814':'PA','835':'PA','878':'PA',
    // Rhode Island
    '401':'RI',
    // South Carolina
    '803':'SC','821':'SC','839':'SC','843':'SC','854':'SC','864':'SC',
    // South Dakota
    '605':'SD',
    // Tennessee
    '423':'TN','615':'TN','629':'TN','731':'TN','865':'TN','901':'TN','931':'TN',
    // Texas
    '210':'TX','214':'TX','254':'TX','281':'TX','325':'TX','346':'TX','361':'TX','409':'TX','430':'TX','432':'TX','469':'TX','512':'TX','621':'TX','682':'TX','713':'TX','726':'TX','737':'TX','762':'TX','806':'TX','817':'TX','830':'TX','832':'TX','903':'TX','915':'TX','936':'TX','940':'TX','945':'TX','956':'TX','972':'TX','979':'TX',
    // Utah
    '385':'UT','435':'UT','801':'UT',
    // Vermont
    '802':'VT',
    // Virginia
    '276':'VA','434':'VA','540':'VA','571':'VA','578':'VA','686':'VA','703':'VA','757':'VA','804':'VA','826':'VA','948':'VA',
    // Washington
    '206':'WA','253':'WA','360':'WA','425':'WA','509':'WA','564':'WA',
    // West Virginia
    '304':'WV','681':'WV',
    // Wisconsin
    '262':'WI','274':'WI','353':'WI','414':'WI','534':'WI','608':'WI','715':'WI','920':'WI',
    // Wyoming
    '307':'WY'
  };
  var US_STATES = {AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',PR:'Puerto Rico'};
  function toE164(raw, iso){
    var c = BY_ISO[iso]; if(!c) return {ok:false, reason:'unknown_country'};
    var s = String(raw||'').trim(); var kept = s.replace(/[^\d+]/g,''); var digits;
    if(kept.charAt(0)==='+'){ digits = kept.slice(1).replace(/\D/g,''); }
    else {
      digits = kept.replace(/\D/g,'');
      if(digits.charAt(0)==='0') digits = digits.replace(/^0+/,'');
      if(c.dial==='1'){ if(digits.length===10) digits='1'+digits; }
      else if(digits.indexOf(c.dial)!==0){ digits = c.dial + digits; }
    }
    if(!/^\d{7,15}$/.test(digits)) return {ok:false, reason:'phone_length'};
    if(iso==='US'){
      var d = digits.charAt(0)==='1' ? digits.slice(1) : digits;
      if(d.length!==10) return {ok:false, reason:'us_format'};
      var ac = d.substring(0,3);
      if(/^[01]/.test(ac) || /^[01]/.test(d.charAt(3))) return {ok:false, reason:'us_format'};
      if(!NANP[ac]) return {ok:false, reason:'non_us_area_code'};
      return {ok:true, e164:'+1'+d, state:NANP[ac]};
    }
    var LEN = {CA:[10],FR:[9],GB:[10],IL:[8,9],AU:[9],CH:[9],BE:[8,9],ES:[9],IT:[9,10],NL:[9],DE:[10,11],MX:[10],BR:[10,11],IN:[10],IE:[9],PT:[9],LU:[6,7,8,9],MC:[8,9]};
    if(LEN[iso]){ var nat = digits.slice(c.dial.length); if(LEN[iso].indexOf(nat.length)<0) return {ok:false, reason:'phone_length'}; }
    return {ok:true, e164:'+'+digits};
  }
  window.FA_GEO = { LIST:LIST, BY_ISO:BY_ISO, NANP:NANP, US_STATES:US_STATES, toE164:toE164,
    stateForPhone:function(raw){ var d=String(raw||'').replace(/\D/g,''); if(d.length===11&&d.charAt(0)==='1') d=d.slice(1); return d.length>=3 ? (NANP[d.substring(0,3)]||'') : ''; } };
})();
