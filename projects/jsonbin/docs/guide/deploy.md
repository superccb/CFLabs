如何在 Cloudfalre Workers 上部署该服务🔗

如下：

    先在 Cloudfalre 创建一个 KV 命名空间, Workers -> KV , 名字可以叫：jsonbin
    然后在Cloudfalre 创建一个 Worker, 在该 Worker 的 Settings -> Variables -> KV Namespace Bindings , 绑定刚刚创建的 KV， Variable name 填：JSONBIN, kv namespace 选择刚刚那个就可以了.
    点击快速编辑，把 main.js 里的代码粘贴进去, 记得修改一下密钥。
    如果有需要，可以在 Triggers 里面配置绑定的自定义域名，我绑定了一个 json.owenyoung.com 