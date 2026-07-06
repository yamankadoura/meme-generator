import trollFace from "./../images/trollface.png"

export default function Header() {
    return (
        <header className="header">
            <div className="brand">
                <img
                    src={trollFace}
                    alt="Meme Generator logo"
                />
                <h1>Meme Generator</h1>
            </div>
        </header>
    )
}