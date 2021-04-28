export type MediaType =
  | 'application'
  | 'audio'
  | 'example'
  | 'font'
  | 'image'
  | 'message'
  | 'model'
  | 'multipart'
  | 'text'
  | 'video';
export type ApplicationMediaSubtype =
  | 'atom+xml'
  | 'EDIFACT'
  | 'json'
  | 'javascript'
  | 'octet-stream'
  | 'ogg'
  | 'pdf'
  | 'postscript'
  | 'soap+xml'
  | 'font-woff'
  | 'xhtml+xml'
  | 'xml-dtd'
  | 'xop+xml'
  | 'zip'
  | 'gzip'
  | 'x-bittorrent'
  | 'x-tex'
  | 'xml'
  | 'msword';
export type AudioMediaSubtype =
  | 'basic'
  | 'L24'
  | 'mp4'
  | 'aac'
  | 'mpeg'
  | 'ogg'
  | 'vorbis'
  | 'x-ms-wma'
  | 'x-ms-wax'
  | 'vnd.rn-realaudio'
  | 'vnd.wave'
  | 'webm';
export type ImageMediaSubtype =
  | 'gif'
  | 'jpeg'
  | 'pjpeg'
  | 'png'
  | 'svg+xml'
  | 'tiff'
  | 'vnd.microsoft.icon'
  | 'vnd.wap.wbmp'
  | 'webp';
export type MessageMediaSubtype = 'http' | 'imdn+xml' | 'partial' | 'rfc822';
export type ModelMediaSubtype = 'example' | 'iges' | 'mesh' | 'vrml' | 'x3d+binary' | 'x3d+vrml' | 'x3d+xml';
export type MultipartMediaSubtype = 'mixed' | 'alternative' | 'related' | 'form-data' | 'signed' | 'encrypted';
export type TextMediaSubtype = 'cmd' | 'css' | 'csv' | 'html' | 'javascript' | 'plain' | 'php' | 'xml' | 'markdown' | 'cache-manifest';
export type VideoMediaSubtype = 'mpeg' | 'mp4' | 'ogg' | 'quicktime' | 'webm' | 'x-ms-wmv' | 'x-flv' | 'x-msvideo' | '3gpp' | '3gpp2';

export type mediaTypeName =
  | `application/${ApplicationMediaSubtype}`
  | `audio/${AudioMediaSubtype}`
  | `image/${ImageMediaSubtype}`
  | `message/${MessageMediaSubtype}`
  | `model/${ModelMediaSubtype}`
  | `multipart/${MultipartMediaSubtype}`
  | `text/${TextMediaSubtype}`
  | `video/${VideoMediaSubtype}`
  ;
