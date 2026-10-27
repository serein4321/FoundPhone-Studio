import {
  Check,
  CreditCard,
  Home,
  MapPin,
  Receipt,
  ShoppingBag,
  Star,
  Ticket,
  Truck,
  Utensils,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  Empty,
  Header,
  Media,
  meta,
  SearchBox,
  Tabs,
  useContent,
  type Props,
} from "./shared";
export function AlipaySkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "賬單");
  const list =
    tab === "卡包"
      ? items.filter((i) => i.folder === "卡包" || i.folder === "票券")
      : items.filter((i) => !["卡包", "票券"].includes(i.folder));
  return (
    <div className="catalog-skin alipay-ui">
      <Header p={p} />
      <div className="alipay-blue">
        <h2>{tab}</h2>
        <div>
          <button onClick={() => setTab("賬單")}>
            <Receipt size={28} />
            賬單
          </button>
          <button onClick={() => setTab("卡包")}>
            <Ticket size={28} />
            卡包
          </button>
        </div>
        <small>作品內的虛構支付記錄</small>
      </div>
      <div className="catalog-scroll">
        <SearchBox value={q} set={setQ} />
        {list.map((i) =>
          tab === "卡包" ? (
            <button
              className="alipay-ticket"
              key={i.id}
              onClick={() => p.onItem(i)}
            >
              <Ticket size={23} />
              <div>
                <strong>{i.title}</strong>
                <p>{i.body}</p>
                <small>{i.time}</small>
              </div>
            </button>
          ) : (
            <button
              className="alipay-bill"
              key={i.id}
              onClick={() => p.onItem(i)}
            >
              <Wallet size={27} />
              <div>
                <strong>{i.title}</strong>
                <small>
                  {meta(i, "merchant", i.sender)} · {i.time.slice(5, 16)}
                </small>
              </div>
              <span>
                <strong>{meta(i, "amount", "—")}</strong>
                <small>{meta(i, "status", "賬單記錄")}</small>
              </span>
            </button>
          ),
        )}
        <Empty items={list} />
      </div>
      <Tabs
        tabs={["賬單", "卡包"]}
        value={tab}
        set={setTab}
        icons={[<Receipt />, <Ticket />]}
      />
    </div>
  );
}
export function TaobaoSkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "商品");
  const [status, setStatus] = useState("全部");
  const [selected, setSelected] = useState<Item | null>(null);
  const [cart, setCart] = useState<Item[]>([]);
  const [checkout, setCheckout] = useState(false);
  const [paymentCard, setPaymentCard] = useState<"mom" | "dad">("mom");
  const [order, setOrder] = useState<{
    item: Item;
    card: string;
    number: string;
  } | null>(null);
  const list = items
    .filter((i) =>
      tab === "商品"
        ? i.folder !== "訂單" && i.folder !== "物流"
        : i.folder === tab,
    )
    .filter((i) => status === "全部" || meta(i, "status") === status);
  const closePanel = () => {
    setSelected(null);
    setCheckout(false);
  };
  const addToCart = () => {
    if (!selected) return;
    setCart((current) =>
      current.some((item) => item.id === selected.id)
        ? current
        : [...current, selected],
    );
  };
  const confirmOrder = () => {
    if (!selected) return;
    setOrder({
      item: selected,
      card:
        paymentCard === "mom"
          ? "陳信宏的家庭卡（虛構）"
          : "溫尚翊的家庭卡（虛構）",
      number: "TB-" + selected.id.slice(-6).toUpperCase(),
    });
    setCart((current) => current.filter((item) => item.id !== selected.id));
    closePanel();
    setTab("訂單");
  };
  return (
    <div className="catalog-skin taobao-ui">
      <Header p={p} />
      <div className="taobao-search">
        <SearchBox value={q} set={setQ} placeholder="搜尋商品或訂單" />
        {tab === "商品" && (
          <span className="taobao-cart-count">購物車 {cart.length}</span>
        )}
      </div>
      <div className="catalog-scroll">
        {tab === "商品" ? (
          <div className="taobao-products">
            {list.map((i) => (
              <button key={i.id} onClick={() => setSelected(i)}>
                <Media item={i} />
                <strong>{i.title}</strong>
                <p>
                  ¥ <b>{meta(i, "price", "—")}</b>
                </p>
                <small>{i.sender}</small>
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="taobao-status">
              {["全部", "待付款", "待發貨", "待收貨", "已完成"].map((s) => (
                <button
                  className={s === status ? "selected" : ""}
                  key={s}
                  onClick={() => setStatus(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            {order && tab === "訂單" && (
              <div className="taobao-order simulated-order">
                <div>
                  <ShoppingBag size={16} />
                  <strong>{order.item.sender}</strong>
                  <small>待發貨</small>
                </div>
                <section>
                  <Media item={order.item} />
                  <span>
                    <strong>{order.item.title}</strong>
                    <p>作品內模擬訂單 · 付款方式：{order.card}</p>
                    <b>¥ {meta(order.item, "price", "—")}</b>
                  </span>
                </section>
                <footer>{order.number} · 不會產生真實扣款</footer>
              </div>
            )}
            {list.map((i) => (
              <button
                className="taobao-order"
                key={i.id}
                onClick={() => p.onItem(i)}
              >
                <div>
                  <ShoppingBag size={16} />
                  <strong>{i.sender}</strong>
                  <small>{meta(i, "status", "訂單記錄")}</small>
                </div>
                <section>
                  <Media item={i} />
                  <span>
                    <strong>{i.title}</strong>
                    <p>
                      {tab === "物流" ? meta(i, "tracking", i.body) : i.body}
                    </p>
                    <b>¥ {meta(i, "price", "—")}</b>
                  </span>
                </section>
                <footer>{meta(i, "number", i.time)}</footer>
              </button>
            ))}
          </>
        )}
        <Empty items={list} />
      </div>
      <Tabs
        tabs={["商品", "訂單", "物流"]}
        value={tab}
        set={(t) => {
          setTab(t);
          setStatus("全部");
        }}
        icons={[<Home />, <ShoppingBag />, <Truck />]}
      />
      {selected && (
        <div className="taobao-panel">
          <div className="taobao-panel-header">
            <strong>{checkout ? "確認訂單" : "商品詳情"}</strong>
            <button aria-label="關閉商品詳情" onClick={closePanel}>
              <X size={19} />
            </button>
          </div>
          <Media item={selected} />
          <h2>{selected.title}</h2>
          <p>{selected.body}</p>
          <strong className="taobao-panel-price">
            ¥ {meta(selected, "price", "—")}
          </strong>
          {!checkout ? (
            <div className="taobao-panel-actions">
              <button onClick={addToCart}>
                {cart.some((item) => item.id === selected.id)
                  ? "已加入購物車"
                  : "加入購物車"}
              </button>
              <button className="primary" onClick={() => setCheckout(true)}>
                立即購買
              </button>
            </div>
          ) : (
            <div className="taobao-payment">
              <small>作品內模擬付款，不會連接真實銀行或產生扣款。</small>
              <button
                className={paymentCard === "mom" ? "selected" : ""}
                onClick={() => setPaymentCard("mom")}
              >
                <CreditCard size={16} />
                陳信宏的家庭卡（虛構）
              </button>
              <button
                className={paymentCard === "dad" ? "selected" : ""}
                onClick={() => setPaymentCard("dad")}
              >
                <CreditCard size={16} />
                溫尚翊的家庭卡（虛構）
              </button>
              <button className="primary" onClick={confirmOrder}>
                <Check size={16} />
                確認下單
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export function DeliverySkin(p: Props) {
  const { tab, setTab, q, setQ, items } = useContent(p, "商家");
  const list = items.filter((i) =>
    tab === "訂單" ? i.folder === "訂單" : i.folder !== "訂單",
  );
  return (
    <div className="catalog-skin delivery-ui">
      <Header p={p} />
      <div className="delivery-location">
        <MapPin size={18} />
        <strong>{meta(items[0], "address", "作品配送地址")}</strong>
      </div>
      <SearchBox value={q} set={setQ} placeholder="搜尋商家或訂單" />
      <div className="catalog-scroll">
        {tab === "商家"
          ? list.map((i) => (
              <button
                className="delivery-merchant"
                key={i.id}
                onClick={() => p.onItem(i)}
              >
                <Media item={i} />
                <div>
                  <h3>{i.title}</h3>
                  <p>
                    <Star size={12} />
                    {meta(i, "rating", "—")}
                    <span>{meta(i, "duration")}</span>
                  </p>
                  <small>{i.body.split("\n")[0]}</small>
                  <strong>¥ {meta(i, "price", "—")}</strong>
                </div>
              </button>
            ))
          : list.map((i) => (
              <button
                className="delivery-order"
                key={i.id}
                onClick={() => p.onItem(i)}
              >
                <header>
                  <Utensils size={18} />
                  <strong>{i.sender}</strong>
                  <span>{meta(i, "status", "配送記錄")}</span>
                </header>
                <section>
                  <Media item={i} />
                  <div>
                    <strong>{i.title}</strong>
                    <p>{i.body}</p>
                    <small>{i.time}</small>
                  </div>
                  <b>¥ {meta(i, "price", "—")}</b>
                </section>
                <footer>
                  <MapPin size={13} />
                  {meta(i, "address")}
                </footer>
              </button>
            ))}
        <Empty items={list} />
      </div>
      <Tabs
        tabs={["商家", "訂單"]}
        value={tab}
        set={setTab}
        icons={[<Utensils />, <Receipt />]}
      />
    </div>
  );
}
