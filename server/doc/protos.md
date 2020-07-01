# Protocol Documentation
<a name="top"></a>

## Table of Contents

- [ping.proto](#ping.proto)
    - [PingRequest](#ping.PingRequest)
    - [PingResponse](#ping.PingResponse)
  
    - [Ping](#ping.Ping)
  
- [settings.proto](#settings.proto)
    - [UpdateSettingsRequest](#ping.UpdateSettingsRequest)
    - [UpdateSettingsResponse](#ping.UpdateSettingsResponse)
  
    - [Settings](#ping.Settings)
  
- [shutdown.proto](#shutdown.proto)
    - [ShutdownRequest](#shutdown.ShutdownRequest)
    - [ShutdownResponse](#shutdown.ShutdownResponse)
  
    - [Shutdown](#shutdown.Shutdown)
  
- [status.proto](#status.proto)
    - [StatusRequest](#status.StatusRequest)
    - [StatusResponse](#status.StatusResponse)
  
    - [Status](#status.Status)
  
- [version.proto](#version.proto)
    - [VersionRequest](#version.VersionRequest)
    - [VersionResponse](#version.VersionResponse)
    - [VersionResponse.ComponentsVersionEntry](#version.VersionResponse.ComponentsVersionEntry)
  
    - [Version](#version.Version)
  
- [Scalar Value Types](#scalar-value-types)



<a name="ping.proto"></a>
<p align="right"><a href="#top">Top</a></p>

## ping.proto



<a name="ping.PingRequest"></a>

### PingRequest



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| peerId | [string](#string) |  |  |






<a name="ping.PingResponse"></a>

### PingResponse



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| latency | [int32](#int32) |  |  |





 

 

 


<a name="ping.Ping"></a>

### Ping


| Method Name | Request Type | Response Type | Description |
| ----------- | ------------ | ------------- | ------------|
| Ping | [PingRequest](#ping.PingRequest) | [PingResponse](#ping.PingResponse) |  |

 



<a name="settings.proto"></a>
<p align="right"><a href="#top">Top</a></p>

## settings.proto



<a name="ping.UpdateSettingsRequest"></a>

### UpdateSettingsRequest



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| is_using_cover_traffic | [bool](#bool) |  |  |
| bootstrap_servers | [string](#string) | repeated |  |






<a name="ping.UpdateSettingsResponse"></a>

### UpdateSettingsResponse



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| latency | [int32](#int32) |  |  |





 

 

 


<a name="ping.Settings"></a>

### Settings


| Method Name | Request Type | Response Type | Description |
| ----------- | ------------ | ------------- | ------------|
| UpdateSettings | [UpdateSettingsRequest](#ping.UpdateSettingsRequest) | [UpdateSettingsResponse](#ping.UpdateSettingsResponse) | update setting on the fly without requiring a restart |

 



<a name="shutdown.proto"></a>
<p align="right"><a href="#top">Top</a></p>

## shutdown.proto



<a name="shutdown.ShutdownRequest"></a>

### ShutdownRequest







<a name="shutdown.ShutdownResponse"></a>

### ShutdownResponse



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| timestamp | [int32](#int32) |  |  |





 

 

 


<a name="shutdown.Shutdown"></a>

### Shutdown


| Method Name | Request Type | Response Type | Description |
| ----------- | ------------ | ------------- | ------------|
| Shutdown | [ShutdownRequest](#shutdown.ShutdownRequest) | [ShutdownResponse](#shutdown.ShutdownResponse) |  |

 



<a name="status.proto"></a>
<p align="right"><a href="#top">Top</a></p>

## status.proto



<a name="status.StatusRequest"></a>

### StatusRequest







<a name="status.StatusResponse"></a>

### StatusResponse



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| ip | [string](#string) |  |  |
| load | [float](#float) |  |  |
| cpu_usage | [float](#float) |  |  |
| connectoed_notes | [int32](#int32) |  |  |





 

 

 


<a name="status.Status"></a>

### Status


| Method Name | Request Type | Response Type | Description |
| ----------- | ------------ | ------------- | ------------|
| GetStatus | [StatusRequest](#status.StatusRequest) | [StatusResponse](#status.StatusResponse) |  |

 



<a name="version.proto"></a>
<p align="right"><a href="#top">Top</a></p>

## version.proto



<a name="version.VersionRequest"></a>

### VersionRequest







<a name="version.VersionResponse"></a>

### VersionResponse



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| version | [string](#string) |  |  |
| components_version | [VersionResponse.ComponentsVersionEntry](#version.VersionResponse.ComponentsVersionEntry) | repeated |  |






<a name="version.VersionResponse.ComponentsVersionEntry"></a>

### VersionResponse.ComponentsVersionEntry



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| key | [string](#string) |  |  |
| value | [string](#string) |  |  |





 

 

 


<a name="version.Version"></a>

### Version


| Method Name | Request Type | Response Type | Description |
| ----------- | ------------ | ------------- | ------------|
| GetVersion | [VersionRequest](#version.VersionRequest) | [VersionResponse](#version.VersionResponse) |  |

 



## Scalar Value Types

| .proto Type | Notes | C++ | Java | Python | Go | C# | PHP | Ruby |
| ----------- | ----- | --- | ---- | ------ | -- | -- | --- | ---- |
| <a name="double" /> double |  | double | double | float | float64 | double | float | Float |
| <a name="float" /> float |  | float | float | float | float32 | float | float | Float |
| <a name="int32" /> int32 | Uses variable-length encoding. Inefficient for encoding negative numbers – if your field is likely to have negative values, use sint32 instead. | int32 | int | int | int32 | int | integer | Bignum or Fixnum (as required) |
| <a name="int64" /> int64 | Uses variable-length encoding. Inefficient for encoding negative numbers – if your field is likely to have negative values, use sint64 instead. | int64 | long | int/long | int64 | long | integer/string | Bignum |
| <a name="uint32" /> uint32 | Uses variable-length encoding. | uint32 | int | int/long | uint32 | uint | integer | Bignum or Fixnum (as required) |
| <a name="uint64" /> uint64 | Uses variable-length encoding. | uint64 | long | int/long | uint64 | ulong | integer/string | Bignum or Fixnum (as required) |
| <a name="sint32" /> sint32 | Uses variable-length encoding. Signed int value. These more efficiently encode negative numbers than regular int32s. | int32 | int | int | int32 | int | integer | Bignum or Fixnum (as required) |
| <a name="sint64" /> sint64 | Uses variable-length encoding. Signed int value. These more efficiently encode negative numbers than regular int64s. | int64 | long | int/long | int64 | long | integer/string | Bignum |
| <a name="fixed32" /> fixed32 | Always four bytes. More efficient than uint32 if values are often greater than 2^28. | uint32 | int | int | uint32 | uint | integer | Bignum or Fixnum (as required) |
| <a name="fixed64" /> fixed64 | Always eight bytes. More efficient than uint64 if values are often greater than 2^56. | uint64 | long | int/long | uint64 | ulong | integer/string | Bignum |
| <a name="sfixed32" /> sfixed32 | Always four bytes. | int32 | int | int | int32 | int | integer | Bignum or Fixnum (as required) |
| <a name="sfixed64" /> sfixed64 | Always eight bytes. | int64 | long | int/long | int64 | long | integer/string | Bignum |
| <a name="bool" /> bool |  | bool | boolean | boolean | bool | bool | boolean | TrueClass/FalseClass |
| <a name="string" /> string | A string must always contain UTF-8 encoded or 7-bit ASCII text. | string | String | str/unicode | string | string | string | String (UTF-8) |
| <a name="bytes" /> bytes | May contain any arbitrary sequence of bytes. | string | ByteString | str | []byte | ByteString | string | String (ASCII-8BIT) |

