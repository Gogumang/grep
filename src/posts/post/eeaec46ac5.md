![wireshark2.png](https://images.gogumang.com/eeaec46ac5/01.png)

## 목차

> Custom Dissector가 왜 필요한가요? 이 글에서 다룰 내용 예제를 만들어 보겠습니다. Wireshark에 적용해 보겠습니다 마치며

## Custom Dissector가 왜 필요한가요?

프로젝트를 하다 보면, 직접 Protocol을 정의, 구현하여 사용하는 경우가 있습니다. 이렇게 직접 만든 Protocol이 HTTP, JSON, XML 등과 같이 잘 알려진 Protocol을 기반으로 하거나, 그렇지 않더라도 Text 기반으로 만든 Protocol이라면 패킷을 캡쳐하여 분석하기가 꽤 수월합니다.

그런데 아래와 같이 byte 기반으로, 심지어 bit 단위까지 쪼개어 사용하는 Protocol 이라면, Wireshark로 패킷을 캡쳐한다고 해도 분석하기가 참 난감합니다.

![1.png](https://images.gogumang.com/eeaec46ac5/02.png)

위 Protocol 포멧은 WebSocket 패킷의 포맷입니다.

물론 Wireshark에서는 WebSocket에 대한 Dissector가 기본으로 포함되어 있습니다만, 만약 포함되어 있지 않다면 패킷을 잡아도 아래 그림과 같이 TCP PSH로 보일 뿐이어서 어떤 PSH가 내가 보고자 하는 패킷인지도 찾기 어렵고, 찾는다고 해도 Hex로 표기된 Byte값을 가지고 일일히 계산해 가며 패킷 내용을 확인해야 하죠.

![2.png](https://images.gogumang.com/eeaec46ac5/03.png)

예를 들어 첫 번째 byte 값이 0x81이니까, 이걸 bit로 풀어내면 1000 0001 이고, Protocol 구조로 봤을 때 FIN flag는 1, 나머지 flag는 0, opcode는 1.. 이라는 식으로 확인을 해야 합니다.

Wireshark에 포함된 WebSocket Dissector를 적용하면 아래와 같이 아름답게(?) 출력되어 좀 더 편하게 패킷을 분석할 수 있습니다.

![3.png](https://images.gogumang.com/eeaec46ac5/04.png)

직접 만들어 사용하는 Protocol을, WebSocket처럼 Wireshark에서 Parsing 된 형태로 바로 볼 수 있다면 패킷 분석을 위한 노력을 많이 절약할 수 있지 않을까요?

## 이 글에서 다룰 내용

이 글에서는 Dissector를 만드는 법에 대해 기본부터 차근차근 설명하기 보다는, TOAST PC에서 Streaming Data를 전송하기 위해 사용하는 Protocol용 Dissector를 만드는 예제를 설명합니다.

우리가 만드는 프로토콜은 의외로(?) 은근히(?) 간단한 경우가 많기 때문에 너무 복잡한 형태의 Protocol이 아니라면, 본문의 예제를 응용하는 것 만으로도 쉽게 만들 수 있습니다.

Wireshark용 Dissector를 만드는 방법엔 몇 가지가 있지만, 본문에서는 lua를 사용하여 만들어 보겠습니다. (예제는 lua를 전혀 다뤄본 적이 없는 상태에서 작성한 코드라, lua를 잘 아시는 분들이 보기엔 많이 엉망일 수 있으니 양해 부탁 드립니다. \^\^)

예제를 보시다가 더 자세한 문법 등이 궁금하시면 아래 Reference를 참고하세요. https://www.wireshark.org/docs/wsdg_html_chunked/wsluarm_modules.html

## 예제를 만들어 보겠습니다.

예제로, TOAST PC에서 스트리밍에 사용하는 Protocol을 사용하겠습니다. TOAST PC에서 스트리밍에 사용하는 패킷은 다음과 같은 구조를 가지고 있습니다. (각 Filed 및 Flag들의 상세 내용은 크게 중요하지 않으므로, 설명은 건너뛰겠습니다. \^\^)

* STR(start) Bit 값이 1일 때

![4.png](https://images.gogumang.com/eeaec46ac5/05.png)

* STR(start) Bit 값이 0일 때

![5.png](https://images.gogumang.com/eeaec46ac5/06.png)

위에서 살펴본 WebSocket에 비하면 상당히 간단한 모양새네요.

본격적으로 만들어 보겠습니다.

1. Protocol Filter 및 이름을 지정하여, 프로토콜 객체를 만듭니다.

```
-- Create ToastPC Streaming protocol
--  "tpcstream" : 프로토콜 이름. Filter 창 등에서 사용
--  "TPCSTREAM" : Packet Detail, List의 Protocol 컬럼에 표시될 프로토콜 Description
p_tpcstream = Proto ("tpcstream", "TPCSTREAM")
```

1. 위에서 만든 "p_tpcstream" 객체의 Field를 정의합니다.

* Field명으로 사용되는 값은, 추후 Wireshark의 Filter 창에서 패킷을 필터링 하기 위한 키워드로 사용될 수 있습니다.
* (예 : tpcstream.encrypted==1)

```
local f = p_tpcstream.fields

-- Field 정의
--   HEADER 공통
--     STARTCODE Field 정의
f.startcode = ProtoField.uint32("tpcstream.startcode", "STARTCODE", base.HEX)

--     FLAGS Field 정의
--     bit data를 다루기 위해서는, unit8() 함수의 마지막에 bits mask 값을 기재합니다.
f.ver = ProtoField.uint8("tpcstream.ver", "VERSION", base.DEC, nil, 0xC0)
f.reserved = ProtoField.uint8("tpcstream.reserved", "RESERVED", base.HEX, nil, 0x30)
f.encrypted = ProtoField.uint8("tpcstream.encrypted", "ENCRYPTED", base.DEC, nil, 0x08)
f.iframe = ProtoField.uint8("tpcstream.iframe", "I-FRAME", base.DEC, nil, 0x04)
f.startframe = ProtoField.uint8("tpcstream.start", "START", base.DEC, nil, 0x02)
f.endframe = ProtoField.uint8("tpcstream.end", "END", base.DEC, nil, 0x01)

--   HEADER Fields for START BIT == 1 
-- 	   Frame Size Field 정의
f.frame_size = ProtoField.uint32("tpcstream.frame_size", "FRAME_SIZE", base.DEC)

--     Frame Count Field 정의
f.frame_count = ProtoField.uint32("tpcstream.frame_count", "FRAME_COUNT", base.DEC)

--   HEADER Fields for START BIT == 0
--       Packet Count Field 정의
f.packet_count = ProtoField.uint16("tpcstream.packet_count", "PACKET_COUNT", base.DEC)

--   BODY : Frame Data
f.frame_data = ProtoField.bytes("tpcstream.frame_data", "FRAME_DATA")
```

1. p_tpcstream 객체의 dissector() 함수를 정의합니다.

* Wireshark에서 해당 Dissector를 사용할 조건(Layer4 Protocol, Port번호 등)에 맞는 패킷을 찾았을 때 호출되는 함수입니다.
* Parameter로 다음 세 값이 전달됩니다.
  * buffer : Packet raw bytes
  * pinfo : Packet Information
  * tree : Packet Detail tree
* Wireshark 창으로 보자면 각각 다음 부분을 나타낸다고 볼 수 있습니다.

![6.png](https://images.gogumang.com/eeaec46ac5/07.png)

* 즉, 이 함수에서는 buffer 값을 가지고 다음을 만들기 위한 내용을 작성하시면 됩니다.
  * Packet 상세 창에 보일 Parsed 값 (tree)
  * Packet 목록 창에 보일 Packet 정보값 (pinfo)

```
-- tpcstream dissector function
function p_tpcstream.dissector (buffer, pinfo, tree)
  -- validate packet length is adequate, otherwise quit
  if buffer:len() == 0 then return end

  ---------------------------------------------------------
  -- 패킷 상세정보 창에 SubTree 추가하기
  ---------------------------------------------------------
  subtree = tree:add(p_tpcstream, buffer(0))

  -- STARTCODE 값 Parsing. 
  -- buffer의 첫번째 byte부터 4byte만큼을 startcode field에 적용하여 추가합니다.
  subtree:add(f.startcode, buffer(0, 4))
  -- FLAGS 값 Parsing. 
  -- buffer의 다섯번째 byte부터 1byte만큼을 읽고, 이를 ver, reserved, encrypted.. 등 
  -- 위에서 정의한 각 bit field에 적용하여 추가합니다.
  local flags = buffer(4, 1)
  -- add flags bit
  subtree:add(f.ver, flags)
  subtree:add(f.reserved, flags)
  subtree:add(f.encrypted, flags)
  subtree:add(f.iframe, flags)
  subtree:add(f.startframe, flags)
  subtree:add(f.endframe, flags)

  -- "start" bit flag 값에 따라 패킷의 형태가 다르므로, 먼저 start bit flag 값을 읽습니다.
  local startbit = buffer(4, 1):bitfield(6, 1)

  -- start bit 값이 1이냐 0이냐에 따라 추가해야 하는 subtree 항목이 달라집니다.
  if startbit == 1 then
    -- start bit 값이 1이면, frame size, frame count, frame data 항목을 추가합니다.
    subtree:add(f.frame_size, buffer(5, 3))
    subtree:add(f.frame_count, buffer(8, 4))
    --subtree:add(f.frame_data, buffer(16))
    -- 다음과 같은 방법으로 다른 Dissector를 불러와 사용할 수 있습니다.
    -- TOAST PC Streaming Protocol의 frame data는 H.264 패킷을 담고 있으므로, 
    -- 아래와 같이 H.264 Protocol Dissector를 불러와 frame data를 Parsing 합니다.
    h264_table = Dissector.get("h264")
    tvb=buffer(16)
    h264_table:call(tvb:tvb(), pinfo, tree)
  else 
    -- start bit 값이 0이면, frame count, packet count, frame data 항목을 추가합니다.
    subtree:add(f.frame_count, buffer(5, 4))
    subtree:add(f.packet_count, buffer(9, 2))
    --subtree:add(f.frame_data, buffer(12))
    h264_table = Dissector.get("h264")
    tvb=buffer(12)
    h264_table:call(tvb:tvb(), pinfo, tree)
  end
  ---------------------------------------------------------

  ---------------------------------------------------------
  -- 패킷 목록 표시창 info 컬럼에 표시될 정보 
  ---------------------------------------------------------
  -- Protocol 컬럼에 표시될 프로토콜 이름 지정
  -- "TPCSTREAM" 으로 설정
  pinfo.cols.protocol = p_tpcstream.name

  -- Info 컬럼에 표시될 프로토콜 정보 문자열 생성
  -- 본 예제에서는 다음과 같은 형태로 출력하도록 작성합니다.
  -- * start bit가 1인 패킷
  --    [프레임 타입] frame count #프레임카운트 start
  -- * end bit가 1인 패킷
  --     frame count #프레임카운트 end seq=#패킷카운트 
  -- * start/end bit가 모두 1인 패킷
  --    [프레임 타입] frame count #프레임카운트 start, end
  -- * 나머지
  --     frame count #프레임카운트 cont. seq=#패킷카운트
  local info_str = "";
  -- 버전 정보 출력
  info_str = info_str.."VER="..version.." "

  local endbit = buffer(4, 1):bitfield(7, 1)
  if startbit == 1 then
    -- start bit가 1이면, I/P Frame 여부와 frame count값, start/end 여부 출력
    local iframe = buffer(4, 1):bitfield(5, 1)
    if iframe == 1 then
      info_str = info_str.."[I-FRAME]"
    else 
     info_str = info_str.."[P-FRAME]"
    end

    local frame_count = buffer(8, 4):uint()
    info_str = info_str.." frame count "..frame_count.." start"
    if endbit == 1 then
      info_str = info_str..", end"
    end
  else
    -- start bit가 0이면, frame count, packet count 값과 continue/end 여부 출력
    local frame_count = buffer(5, 4):uint()
    local packet_count = buffer(9, 2):uint()
    info_str = info_str.." frame count "..frame_count
    if endbit == 1 then 
      info_str = info_str.." end "
    else
      info_str = info_str.." cont. "
    end

    info_str = info_str.."seq="..packet_count
  end

  -- 생성한 문자열을 Info 컬럼 값으로 설정
  pinfo.cols.info = info_str
  --------------------------------------------------------
end
```

1. p_tpcstream의 init() 함수를 정의합니다.

* 이름 그대로 초기화 시 호출되는 함수입니다.
* 본 예제에서는 특별히 처리할 것이 없으므로 비워둡니다.

```
-- Initialization routine
function p_tpcstream.init()
end
```

1. 이렇게 만들어진 Dissector를 Wireshark의 Dissector Table에 추가함으로써 마무리됩니다. :)

* UDP Port 7010, 8010번을 통해 전송되는 패킷은 이 Dissector를 태우도록 설정합니다.

```
local udp_dissector_table = DissectorTable.get("udp.port")
udp_dissector_table:add(7010, p_tpcstream)
udp_dissector_table:add(8010, p_tpcstream)
```

## Wireshark에 적용해 보겠습니다

이상의 내용을 작성한 후 lua 확장자를 가지는 파일명으로 저장합니다.

* Windows 기준으로, `D:\tools\tpcstream.lua` 에 저장하겠습니다.

Wireshark가 설치된 경로에서

```
init.lua
```

파일을 관리자 권한으로 실행한 에디터로 연 후, 파일 맨 끝에 다음과 같이 `tpcstream.lua` 파일의 경로를 지정한 후 저장합니다.

```
dofile("D:\\tools\\tpc_stream.lua")
```

이후 Wireshark를 실행하면 끝!

실제 패킷을 캡쳐한 후 Wireshark로 열어보면 다음과 같이 표시되는 것을 볼 수 있습니다.

![7.png](https://images.gogumang.com/eeaec46ac5/08.png)

## 마치며

사실, 기존에 사용되고 있는 훌륭한 범용 Protocol 과 그 Protocol을 다루기 위한 라이브러리들이 많이 있기 때문에 직접 Protocol을 정의하여 사용할 일은 많지 않으리라 생각합니다. 그리고 Protocol의 특성에 따라 굳이 Wireshark에서 Dissector를 통해 패킷을 분석할 필요가 없거나, 있더라도 이미 만들어진 Dissector가 대부분 존재하기에 이렇게 Dissector까지 만들어야 할 경우는 많지 않습니다.

하지만, 직접 만들어 사용하는 Protocol에 대해서가 아니더라도 Protocol Dissector를 만들어 보는 일은 그 Protocol에 대해 좀 더 상세히 이해하고 공부하기에 꽤 괜찮은 방법이라고 생각합니다. Protocol의 구조를 파악할 수 있고, 각 Field 값에 따른 처리 로직을 이해하게 되고, 많은 정보 중 중요한 정보를 추려서 출력하는 작업들이 포함되어 있기 때문이죠.

Protocol을 공부하는데, 혹은 언젠가 만들어질 자체 Protocol을 사용하는 프로젝트를 수행하는 데 있어 이 글이 조금이라도 도움이 되었으면 합니다.

읽어주셔서 감사합니다. \^\^